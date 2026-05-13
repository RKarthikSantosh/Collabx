const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec, execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { VM } = require('vm2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

/**
 * Robust execution function that uses spawn to handle large IO and multi-line stdin.
 * Resolves the issue where Python scripts would hit EOF errors with multi-line inputs.
 */
function execWithInput(command, args, options = {}) {
  const { timeout = 10000, input = '' } = options;
  
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let isResolved = false;

    const child = spawn(command, args, {
      timeout: timeout,
      shell: false
    });

    // Write input to stdin and close it promptly
    if (child.stdin) {
      if (input) {
        child.stdin.write(input + '\n');
      }
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Enforce timeout
    const timer = setTimeout(() => {
      if (!isResolved) {
        child.kill();
        isResolved = true;
        resolve({ 
          stdout, 
          stderr: stderr + '\n[CollabX] Error: Execution timed out (10s limit).', 
          error: true 
        });
      }
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (!isResolved) {
        isResolved = true;
        resolve({ stdout, stderr, code });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (!isResolved) {
        isResolved = true;
        resolve({ stdout, stderr: stderr + '\n[CollabX] Error: ' + err.message, error: true });
      }
    });
  });
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logger middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, college) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, college]
    );
    
    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (err) {
    console.error('Registration Error:', err); // Log the exact error to console
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error registering user: ' + (err.sqlMessage || err.message) });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Login error: ' + err.message });
  }
});

// In-memory storage for rooms/contests (keep for socket rooms)
const rooms = new Map();
const contests = new Map();

// Track connected users: socketId -> { userName, roomCode } or { userName, contestCode }
const connectedUsers = new Map();

// Routes
app.get('/api/rooms/:code', (req, res) => {
  const room = rooms.get(req.params.code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

app.post('/api/rooms', (req, res) => {
  const { name } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = { 
    code, 
    name, 
    createdBy: name, 
    users: [name], 
    codeContent: '', 
    language: 'javascript',
    customInput: '',
    chatMessages: [] // Store chat history in room
  };
  rooms.set(code, room);
  res.json({ code });
});

// Contest Routes
app.get('/api/contests', (req, res) => {
  const contestList = Array.from(contests.values()).map(c => ({
    name: c.name,
    code: c.code,
    startTime: c.startTime,
    durationSeconds: c.durationSeconds,
    participantCount: c.participants.length,
    createdBy: c.createdBy
  }));
  res.json(contestList);
});

app.post('/api/contests/:code/end', (req, res) => {
  const contest = contests.get(req.params.code);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  
  const { userName } = req.body;
  if (contest.createdBy !== userName) {
    return res.status(403).json({ error: 'Only the creator can end the contest' });
  }

  // Set endTime to now
  const now = Date.now();
  contest.durationSeconds = Math.floor((now - contest.startTime) / 1000);
  res.json({ message: 'Contest ended successfully', contest });
});

app.delete('/api/contests/:code', (req, res) => {
  const contest = contests.get(req.params.code);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  
  const { userName } = req.query; // Send via query for DELETE
  if (contest.createdBy !== userName) {
    return res.status(403).json({ error: 'Only the creator can delete the contest' });
  }

  contests.delete(req.params.code);
  res.json({ message: 'Contest deleted successfully' });
});

app.get('/api/contests/:code', (req, res) => {
  const contest = contests.get(req.params.code);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });
  res.json(contest);
});

app.post('/api/contests', (req, res) => {
  try {
    const { name, createdBy, problems, durationSeconds } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const contest = {
      code,
      name,
      createdBy,
      problems: problems || [],
      durationSeconds,
      startTime: req.body.startTime || Date.now(),
      participants: [
        {
          id: Math.random().toString(36).substring(7),
          name: createdBy,
          problemsSolved: 0,
          timeTaken: 0,
          score: 0,
          solvedProblems: []
        }
      ],
      status: 'active'
    };
    
    contests.set(code, contest);
    res.json({ code, contest });
  } catch (err) {
    res.status(500).json({ message: 'Error creating contest: ' + err.message });
  }
});


// JDoodle API Credentials (Now using environment variables for safety)
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;

// Language mapping for JDoodle
const languageMap = {
  javascript: { language: "nodejs", versionIndex: "4" },
  python: { language: "python3", versionIndex: "4" },
  java: { language: "java", versionIndex: "4" },
  cpp: { language: "cpp17", versionIndex: "1" },
  c: { language: "c", versionIndex: "5" }
};

// Technical Statistics Proxy (Keeps API Key Secure)
app.post('/api/stats', async (req, res) => {
  try {
    const { code, language } = req.body;
    const apiKey = process.env.STATS_API_KEY;

    // Securely calculate and return metrics (simulating external analysis)
    const lines = code.split('\n');
    const result = {
      totalLines: lines.length,
      totalChars: code.length,
      complexity: lines.length > 50 ? 'High' : (lines.length > 20 ? 'Moderate' : 'Low'),
      language: language.toUpperCase(),
      distribution: [
        { label: 'Scripting', percentage: language === 'javascript' ? 85 : 15, color: '#f7df1e' },
        { label: 'Logic', percentage: language === 'python' ? 70 : 60, color: '#3b82f6' },
        { label: 'Optimization', percentage: 25, color: '#10b981' }
      ]
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Stats analysis failed' });
  }
});

// Compiler endpoint (Switched to JDoodle API)
app.post('/api/compile', async (req, res) => {
  try {
    const { code, language, input = '' } = req.body;
    
    const config = languageMap[language];
    if (!config) {
      return res.status(400).json({ success: false, error: 'Unsupported language' });
    }

    const payload = {
      clientId: JDOODLE_CLIENT_ID,
      clientSecret: JDOODLE_CLIENT_SECRET,
      script: code,
      stdin: input,
      language: config.language,
      versionIndex: config.versionIndex
    };

    const response = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.statusCode === 200) {
      res.json({
        success: true,
        output: result.output || 'Execution successful',
        memory: result.memory,
        cpuTime: result.cpuTime,
        error: '',
        exitCode: 0
      });
    } else {
      res.json({
        success: false,
        output: '',
        error: result.error || 'Compilation Error from Remote Service',
        exitCode: result.statusCode || 1
      });
    }

  } catch (err) {
    console.error('Remote Compile Error:', err.message);
    res.status(500).json({
      success: false,
      output: '',
      error: 'API Error: ' + err.message,
      exitCode: -1
    });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data) => {
    const { roomCode, userName } = data;
    
    const room = rooms.get(roomCode);
    
    // Only allow joining existing rooms
    if (!room) {
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }
    
    socket.join(roomCode);
    
    // Track this user connection
    connectedUsers.set(socket.id, { userName, roomCode });
    
    // Add user to room if not already present
    if (!room.users.includes(userName)) {
      room.users.push(userName);
    }
    
    // Send complete room state to the joining user (including chat history)
    socket.emit('room-joined', {
      ...room,
      chatMessages: room.chatMessages || [] // Ensure chat messages are included
    });
    
    // Notify other users in the room that someone joined
    socket.to(roomCode).emit('user-joined', userName);
  });

  socket.on('code-change', (data) => {
    const { roomCode, code } = data;
    const room = rooms.get(roomCode);
    if (room) {
      room.codeContent = code;
    }
    socket.to(roomCode).emit('code-update', code);
  });

  socket.on('language-change', (data) => {
    const { roomCode, userName, language } = data;
    const room = rooms.get(roomCode);
    if (room) {
      room.language = language;
    }
    socket.to(roomCode).emit('language-changed', {
      userName,
      language
    });
  });

  socket.on('output-change', (data) => {
    const { roomCode, output, outputType } = data;
    socket.to(roomCode).emit('output-shared', {
      output,
      outputType
    });
  });

  socket.on('input-change', (data) => {
    const { roomCode, input } = data;
    const room = rooms.get(roomCode);
    if (room) {
      room.customInput = input;
    }
    socket.to(roomCode).emit('input-shared', input);
  });

  socket.on('cursor-move', (data) => {
    const { roomCode, userName, line, column } = data;
    // Broadcast cursor position to all other users in the room
    socket.to(roomCode).emit('cursor-moved', {
      userName,
      line,
      column
    });
  });

  socket.on('send-chat-message', (data) => {
    const { roomCode, userName, message, timestamp } = data;
    
    const room = rooms.get(roomCode);
    if (!room) return;
    
    // Store message in room state
    if (!room.chatMessages) room.chatMessages = [];
    room.chatMessages.push({ userName, message, timestamp });
    
    // Limit chat history to last 100 messages
    if (room.chatMessages.length > 100) {
      room.chatMessages = room.chatMessages.slice(-100);
    }
    
    // Broadcast chat message to all users in the room (including sender)
    io.to(roomCode).emit('chat-message', {
      userName,
      message,
      timestamp
    });
  });

  // Contest handlers
  socket.on('join-contest', (data) => {
    const { contestCode, userName } = data;
    
    const contest = contests.get(contestCode);
    if (!contest) {
      socket.emit('contest-error', { message: 'Contest not found' });
      return;
    }
    
    socket.join(contestCode);
    connectedUsers.set(socket.id, { userName, contestCode });
    
    // Check if user already in contest
    const existingParticipant = contest.participants.find(p => p.name === userName);
    if (!existingParticipant) {
      contest.participants.push({
        id: socket.id,
        name: userName,
        problemsSolved: 0,
        timeTaken: 0,
        score: 0,
        solvedProblems: [],
        problemScores: {},
        lastSubmissionTime: null
      });
    }
    
    // Send complete contest state to joining user
    socket.emit('contest-joined', {
      ...contest,
      participants: contest.participants
    });
    
    // Broadcast updated leaderboard
    io.to(contestCode).emit('leaderboard-update', {
      participants: contest.participants
    });
  });

  socket.on('submit-solution', (data) => {
    const { contestCode, userName, problemIndex, allPassed } = data;
    
    const contest = contests.get(contestCode);
    if (!contest) return;
    
    const participant = contest.participants.find(p => p.name === userName);
    if (!participant) return;
    
    const problem = contest.problems[problemIndex];
    const maxScore = problem.score || 100;
    
    // Calculate score based on passed test cases proportion
    const passedCount = data.testResults ? data.testResults.filter(t => t.passed).length : (allPassed ? 1 : 0);
    const totalCount = data.testResults ? (data.testResults.length || 1) : 1;
    let scoreGained = Math.floor((passedCount / totalCount) * maxScore);
    
    const now = Date.now();
    const elapsed = (now - contest.startTime) / 1000;
    
    // Always store latest submission timestamp
    participant.lastSubmissionTime = now;
    
    if (!participant.problemScores) participant.problemScores = {};
    const previousScore = participant.problemScores[problemIndex] || 0;
    
    if (scoreGained > previousScore) {
      participant.score += (scoreGained - previousScore);
      participant.problemScores[problemIndex] = scoreGained;
      
      if (allPassed && !participant.solvedProblems.includes(problemIndex)) {
        participant.solvedProblems.push(problemIndex);
        participant.problemsSolved += 1;
        participant.timeTaken = elapsed;
      }
    }
    
    // Broadcast updated leaderboard
    io.to(contestCode).emit('leaderboard-update', {
      participants: contest.participants
    });
    
    // Send result to submitter
    socket.emit('submission-result', {
      success: allPassed,
      message: allPassed ? '✅ Accepted!' : '❌ Wrong Answer',
      testResults: data.testResults
    });
  });

  socket.on('send-chat-message', (data) => {
    const { contestCode, userName, message, timestamp } = data;
    
    // Broadcast chat message to all users in the contest
    io.to(contestCode).emit('chat-message', {
      userName,
      message,
      timestamp
    });
  });


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Get user info from connected users map
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      const { userName, roomCode, contestCode } = userInfo;
      
      // Handle room disconnect
      if (roomCode) {
        const room = rooms.get(roomCode);
        if (room) {
          room.users = room.users.filter(user => user !== userName);
          socket.to(roomCode).emit('user-left', userName);
          
          // Clean up empty rooms after a delay
          if (room.users.length === 0) {
            setTimeout(() => {
              if (rooms.get(roomCode) && rooms.get(roomCode).users.length === 0) {
                rooms.delete(roomCode);
                console.log(`Cleaned up empty room: ${roomCode}`);
              }
            }, 30000);
          }
        }
      }
      
      // Handle contest disconnect
      if (contestCode) {
        const contest = contests.get(contestCode);
        if (contest) {
          // Keep user in contest for leaderboard but mark as disconnected
          socket.to(contestCode).emit('leaderboard-update', {
            participants: contest.participants
          });
        }
      }
      
      connectedUsers.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});