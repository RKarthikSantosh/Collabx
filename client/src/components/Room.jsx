import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { submitCode } from '../services/compilerService';
import LanguageChangeModal from './LanguageChangeModal';
import CodeStatisticsModal from './CodeStatisticsModal';

import './Room.css';

// Colors for different users' cursors
const cursorColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C9B0'
];

function getColorForUser(userName) {
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = ((hash << 5) - hash) + userName.charCodeAt(i);
    hash = hash & hash;
  }
  return cursorColors[Math.abs(hash) % cursorColors.length];
}

function Room() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name');
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  
  const [code, setCode] = useState('// Start coding...');
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [outputType, setOutputType] = useState(''); // 'success' or 'error'
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageChangeInfo, setLanguageChangeInfo] = useState({ user: '', language: '' });
  const [remoteCursors, setRemoteCursors] = useState({}); // { userName: { line, column, color } }
  const [chatMessages, setChatMessages] = useState([]); // Array of { userName, message, timestamp }
  const [chatInput, setChatInput] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState({});


  useEffect(() => {
    if (!userName) {
      navigate('/');
      return;
    }

    // Initialize socket connection for this component instance
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });
      
      console.log('Socket initialized:', socketRef.current.id);
    }

    const socket = socketRef.current;

    // Emit join-room event
    socket.emit('join-room', { roomCode, userName });



    // Listen for room joined
    socket.on('room-joined', (room) => {
      console.log('Room joined:', room);
      setCode(room.codeContent || code);
      setUsers(room.users || []);
      setLanguage(room.language || 'javascript');
      setCustomInput(room.customInput || '');
      setChatMessages(room.chatMessages || []);
    });

    socket.on('room-error', (error) => {
      alert(`Error joining room: ${error.message}`);
      navigate('/');
    });

    socket.on('code-update', (newCode) => {
      console.log('Code update received');
      setCode(newCode);
    });

    socket.on('user-joined', (name) => {
      console.log('User joined:', name);
      setUsers(prev => {
        if (!prev.includes(name)) {
          return [...prev, name];
        }
        return prev;
      });
    });

    socket.on('user-left', (userName) => {
      console.log('User left:', userName);
      setUsers(prev => prev.filter(user => user !== userName));
    });

    socket.on('language-changed', (data) => {
      console.log('Language changed:', data);
      setLanguageChangeInfo({ user: data.userName, language: data.language });
      setShowLanguageModal(true);
    });

    socket.on('output-shared', (data) => {
      console.log('Output shared:', data);
      setOutput(data.output);
      setOutputType(data.outputType);
    });

    socket.on('input-shared', (input) => {
      setCustomInput(input);
    });

    socket.on('cursor-moved', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userName]: {
          line: data.line,
          column: data.column,
          color: getColorForUser(data.userName)
        }
      }));
    });

    socket.on('chat-message', (data) => {
      console.log('Chat message received:', data);
      setChatMessages(prev => {
        const exists = prev.some(msg => 
          msg.userName === data.userName && 
          msg.message === data.message && 
          msg.timestamp === data.timestamp
        );
        if (!exists) {
          return [...prev, {
            userName: data.userName,
            message: data.message,
            timestamp: data.timestamp
          }];
        }
        return prev;
      });
    });

    return () => {
      socket.off('room-joined');
      socket.off('room-error');
      socket.off('code-update');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('language-changed');
      socket.off('output-shared');
      socket.off('input-shared');
      socket.off('cursor-moved');
      socket.off('chat-message');
    };
  }, [roomCode, userName, navigate]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
    // Emit language change to other users
    if (socketRef.current) {
      socketRef.current.emit('language-change', {
        roomCode,
        userName,
        language: newLanguage
      });
    }
  };

  const handleModalConfirm = () => {
    setShowLanguageModal(false);
    setLanguage(languageChangeInfo.language);
  };

  const handleCodeChange = (value) => {
    setCode(value);
    if (socketRef.current) {
      socketRef.current.emit('code-change', { roomCode, code: value });
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCustomInput(value);
    if (socketRef.current) {
      socketRef.current.emit('input-change', { roomCode, input: value });
    }
  };

  // Handle cursor position changes in the editor
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    
    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((event) => {
      const line = event.position.lineNumber;
      const column = event.position.column;
      
      // Emit cursor position to other users
      if (socketRef.current) {
        socketRef.current.emit('cursor-move', {
          roomCode,
          userName,
          line,
          column
        });
      }
    });
  };

  // Update remote cursor decorations
  useEffect(() => {
    if (!editorRef.current) return;
    
    const decorations = Object.entries(remoteCursors).map(([user, cursor]) => ({
      range: {
        startLineNumber: cursor.line,
        startColumn: cursor.column,
        endLineNumber: cursor.line,
        endColumn: cursor.column
      },
      options: {
        isWholeLine: false,
        className: 'remote-cursor',
        glyphMarginClassName: 'remote-cursor-glyph',
        glyphMarginHoverMessage: { value: `${user}'s cursor` },
        decorationAttachesTo: 'before',
        before: {
          content: '▌',
          inlineClassName: `remote-cursor-marker`,
          inlineClassNameAffectsLetterSpacing: true,
          color: cursor.color,
          margin: '0 2px'
        },
        after: {
          content: user,
          inlineClassName: 'remote-cursor-label',
          backgroundColor: cursor.color,
          color: '#fff',
          margin: '0 0 0 4px',
          fontSize: '11px',
          padding: '1px 3px',
          borderRadius: '2px',
          fontWeight: 'bold'
        }
      }
    }));

    editorRef.current.deltaDecorations(
      editorRef.current.getModel()?.getAllDecorations().map(d => d.id) || [],
      decorations
    );
  }, [remoteCursors]);

  // Handle sending chat messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const messageData = {
      roomCode,
      userName,
      message: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    // Emit to server (message will come back through socket event)
    if (socketRef.current) {
      socketRef.current.emit('send-chat-message', messageData);
    }

    setChatInput('');
  };

  const handleCompile = async () => {
    setLoading(true);
    setOutput('Compiling and executing...');
    setOutputType('');
    
    try {
      const result = await submitCode(code, language, customInput);
      
      // Combine output and error
      let displayOutput = result.output || '';
      if (result.error && result.error.trim()) {
        displayOutput += (displayOutput ? '\n\n' : '') + result.error;
      }
      
      const finalOutput = displayOutput || 'Program executed successfully';
      const finalOutputType = result.success ? 'success' : 'error';
      
      setOutput(finalOutput);
      setOutputType(finalOutputType);

      // Share output with all users in room
      if (socketRef.current) {
        socketRef.current.emit('output-change', {
          roomCode,
          userName,
          output: finalOutput,
          outputType: finalOutputType
        });
      }
    } catch (err) {
      const errorMsg = 'Error: ' + err.message;
      setOutput(errorMsg);
      setOutputType('error');
      
      if (socketRef.current) {
        socketRef.current.emit('output-change', {
          roomCode,
          userName,
          output: errorMsg,
          outputType: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleFetchStats = async () => {
    setStatsLoading(true);
    setShowStatsModal(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, language })
      });

      const stats = await response.json();
      await new Promise(r => setTimeout(r, 800)); // Smooth transition
      setStatsData(stats);
    } catch (err) {
      console.error('Stats API Failure:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="room-container">
      <LanguageChangeModal
        userName={languageChangeInfo.user}
        newLanguage={languageChangeInfo.language}
        onConfirm={handleModalConfirm}
        isOpen={showLanguageModal}
      />



      <CodeStatisticsModal 
        isOpen={showStatsModal} 
        onClose={() => setShowStatsModal(false)} 
        stats={statsData} 
        loading={statsLoading} 
      />

      <div className="room-sidebar">
        <div className="room-info">
          <div className="room-code-display">{roomCode}</div>
          
          <h3>👥 Users</h3>
        </div>

        <div className="users-list">
          <h4>Online ({users.length})</h4>
          <ul>
            {users.map((user, idx) => (
              <li key={idx}>{user}</li>
            ))}
          </ul>
        </div>

        <div className="chat-section">
          <h4>💬 Chat</h4>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <span className="chat-user" style={{ color: getColorForUser(msg.userName) }}>
                  {msg.userName}:
                </span>
                <span className="chat-text">{msg.message}</span>
              </div>
            ))}
          </div>
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
              maxLength={200}
            />
            <button type="submit" className="chat-send-btn">📤</button>
          </form>
        </div>
      </div>

      <div className="room-main">
        <div className="editor-header">
          <div className="editor-title">CollabX Editor</div>
          <div className="language-selector-group">
            <label htmlFor="lang-select">Language:</label>
            <select 
              id="lang-select"
              className="language-select-header"
              value={language} 
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>
        <div className="editor-container">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
            }}
          />
        </div>
        <div className="editor-footer">
          <div className="editor-footer-controls">
            <button 
              className={`btn-compile-footer ${loading ? 'loading' : ''}`}
              onClick={handleCompile}
              disabled={loading}
            >
              {loading ? '⏳ Running...' : '▶ Compile & Run'}
            </button>
            <button 
              className="btn-stats-footer"
              onClick={handleFetchStats}
            >
              📊 Statistics
            </button>

          </div>
          <div className="io-container">
            <div className="input-section">
              <div className="io-header">Standard Input</div>
              <textarea
                className="input-textarea"
                value={customInput}
                onChange={handleInputChange}
                placeholder="Enter standard input here..."
                spellCheck={false}
              />
            </div>
            <div className="output-section">
              <div className="io-header">Output</div>
              <div className={`output-display-footer ${outputType}`}>
                {output || 'Output will appear here...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;