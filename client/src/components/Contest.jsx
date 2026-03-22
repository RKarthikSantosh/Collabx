import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { submitCode } from '../services/compilerService';
import ContestTimer from './ContestTimer';
import InteractiveTerminal from './InteractiveTerminal';
import './Contest.css';

function Contest() {
  const { contestCode } = useParams();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name');
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const editorRef = useRef(null);

  const [contest, setContest] = useState(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  
  // Persistent Storage Keys
  const codeKey = `collabx_contest_${contestCode}_p${currentProblemIndex}_code`;
  const langKey = `collabx_contest_${contestCode}_p${currentProblemIndex}_lang`;

  const [code, setCode] = useState(() => localStorage.getItem(codeKey) || '// Start coding...');
  const [language, setLanguage] = useState(() => localStorage.getItem(langKey) || 'javascript');
  const [output, setOutput] = useState('');
  const [outputType, setOutputType] = useState('');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [contestStarted, setContestStarted] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [customOutputType, setCustomOutputType] = useState('');
  const [runInput, setRunInput] = useState('');
  const [showRunInput, setShowRunInput] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isStarted = contest && currentTime >= contest.startTime;

  // Interactive Terminal State
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isProgramRunning, setIsProgramRunning] = useState(false);

  // Function to handle interactive code execution
  const handleInteractiveRun = async () => {
    setShowTerminal(true);
    setTerminalOutput('Starting interactive execution...\n');
    setIsProgramRunning(true);

    try {
      // Start interactive execution
      const response = await fetch('http://localhost:5000/api/interactive-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.sessionId) {
        // Program started successfully, waiting for input
        setTerminalOutput(prev => prev + 'Program started. Waiting for input...\n');
        // In a real implementation, you'd set up WebSocket connection here
        // For now, we'll simulate with a timeout
        setTimeout(() => {
          setTerminalOutput(prev => prev + 'Interactive session ready.\n');
        }, 1000);
      }
    } catch (error) {
      setTerminalOutput(prev => prev + `Error: ${error.message}\n`);
      setIsProgramRunning(false);
    }
  };

  // Handle input from terminal
  const handleTerminalInput = async (input) => {
    setTerminalOutput(prev => prev + `> ${input}\n`);

    try {
      // Send input to running program
      const response = await fetch('http://localhost:5000/api/interactive-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'current-session', // In real implementation, track session ID
          input: input
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.output) {
          setTerminalOutput(prev => prev + result.output + '\n');
        }
        if (result.finished) {
          setTerminalOutput(prev => prev + 'Program finished.\n');
          setIsProgramRunning(false);
        }
      }
    } catch (error) {
      setTerminalOutput(prev => prev + `Error sending input: ${error.message}\n`);
    }
  };

  // Function to detect if code might need input
  const detectInputRequirement = (code, language) => {
    const inputPatterns = {
      javascript: [/\b(prompt|readline|process\.stdin|fs\.readFileSync)/i],
      python: [/\b(input|raw_input|sys\.stdin\.read|sys\.stdin\.readline)/i],
      java: [/\bScanner|System\.in\.read|BufferedReader|InputStreamReader/i],
      cpp: [/\bcin|scanf|getline|std::cin/i]
    };

    const patterns = inputPatterns[language] || [];
    return patterns.some(pattern => pattern.test(code));
  };
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [currentUserStats, setCurrentUserStats] = useState({
    problemsSolved: 0,
    timeTaken: 0,
    score: 0
  });

  useEffect(() => {
    if (!userName) {
      navigate('/');
      return;
    }

    // Initialize socket
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });
    }

    const socket = socketRef.current;

    // Join contest
    socket.emit('join-contest', { contestCode, userName });

    socket.on('contest-joined', (contestData) => {
      console.log('Contest joined:', contestData);
      setContest(contestData);
      setContestStarted(true);
      setParticipants(contestData.participants || []);
    });

    socket.on('contest-error', (error) => {
      alert(`Error joining contest: ${error.message}`);
      navigate('/');
    });

    socket.on('leaderboard-update', (data) => {
      setParticipants(data.participants);
    });

    socket.on('submission-result', (result) => {
      console.log('Submission result:', result);
      setTestResults(result.testResults);
      setOutput(result.message);
      setOutputType(result.success ? 'success' : 'error');
      
      if (result.success) {
        // Update stats
        setCurrentUserStats(prev => ({
          ...prev,
          problemsSolved: prev.problemsSolved + 1
        }));
      }
    });

    return () => {
      socket.off('contest-joined');
      socket.off('contest-error');
      socket.off('leaderboard-update');
      socket.off('submission-result');
    };
  }, [contestCode, userName, navigate]);

  // Sync with localStorage when currentProblemIndex changes
  useEffect(() => {
    const savedCode = localStorage.getItem(codeKey);
    const savedLang = localStorage.getItem(langKey);
    
    if (savedCode !== null) setCode(savedCode);
    else setCode('// Start coding...');
    
    if (savedLang !== null) setLanguage(savedLang);
    else setLanguage('javascript');
  }, [currentProblemIndex, codeKey, langKey]);

  const executeTests = async (isSubmit) => {
    if (!contest) return;

    setLoading(true);
    if (isSubmit) setTestResults([]);
    setOutput(isSubmit ? 'Running all test cases...' : 'Compiling and running...');

    try {
      const problem = contest.problems[currentProblemIndex];
      
      // RUN MODE: Just run with sample input (first test case) or just show raw output
      if (!isSubmit) {
        const testCase = problem.testCases[0] || { input: '', output: '' };
        const result = await submitCode(code, language, testCase.input || '');
        
        // Show raw output and error
        let displayOutput = result.output || '';
        if (result.error) {
          displayOutput += (displayOutput ? '\n\n' : '') + 'Error:\n' + result.error;
        }
        
        setOutput(displayOutput || 'Program executed successfully (no output)');
        setOutputType(result.success ? 'success' : 'error');
        setLoading(false);
        return;
      }

      // SUBMIT MODE: Run all test cases and validate
      const testCasesToRun = problem.testCases || [];
      const newTestResults = [];
      let allPassed = true;

      const normalize = (str) => {
        if (!str) return '';
        return str.replace(/\r\n/g, '\n').split('\n').map(line => line.trim()).filter(line => line).join('\n').trim();
      };

      for (let idx = 0; idx < testCasesToRun.length; idx++) {
        const testCase = testCasesToRun[idx];
        const result = await submitCode(code, language, testCase.input || '');
        
        const userOutput = normalize(result.output);
        const expectedOutput = normalize(testCase.output);
        const passed = result.success && (userOutput === expectedOutput);

        if (!passed) allPassed = false;

        newTestResults.push({
          index: idx + 1,
          passed,
          input: testCase.input,
          expectedOutput,
          userOutput,
          status: passed ? '✓ PASS' : '✗ FAIL',
          error: result.error || (passed ? '' : (result.success ? 'Wrong Answer' : 'Runtime Error'))
        });
      }

      const message = allPassed
        ? '🎉 All test cases passed!'
        : `${newTestResults.filter(t => t.passed).length}/${newTestResults.length} test cases passed`;

      setTestResults(newTestResults);
      setOutput(message);
      setOutputType(allPassed ? 'success' : 'partial');

      if (socketRef.current) {
        socketRef.current.emit('submit-solution', {
          contestCode,
          userName,
          problemIndex: currentProblemIndex,
          code,
          language,
          allPassed,
          testResults: newTestResults
        });
      }
    } catch (err) {
      setOutput('Error: ' + err.message);
      setOutputType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => executeTests(false);
  const handleSubmit = () => executeTests(true);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem(langKey, newLang);
  };

  const handleCodeChange = (val) => {
    const newCode = val || '';
    setCode(newCode);
    localStorage.setItem(codeKey, newCode);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleRunCustom = async () => {
    if (!customInput.trim()) {
      alert('Please enter custom input first');
      return;
    }

    setLoading(true);
    setCustomOutput('Running with custom input...');
    setCustomOutputType('');

    try {
      const result = await submitCode(code, language, customInput);
      setCustomOutput(result.output || 'No output');
      setCustomOutputType('custom-output');
    } catch (err) {
      setCustomOutput('Error: ' + err.message);
      setCustomOutputType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!contest) {
    return (
      <div className="contest-loading">
        <div className="spinner"></div>
        <p>Loading contest...</p>
      </div>
    );
  }

  // Pre-contest Waiting Screen
  if (!isStarted && contest) {
    const secondsToStart = Math.floor((contest.startTime - currentTime) / 1000);
    const h = Math.floor(secondsToStart / 3600);
    const m = Math.floor((secondsToStart % 3600) / 60);
    const s = secondsToStart % 60;
    const countdownStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="status-badge">Upcoming Contest</div>
          <h1>{contest.name}</h1>
          <p className="contest-info">Organized by {contest.createdBy}</p>
          
          <div className="countdown-container">
            <span className="launch-text">Contest starts in</span>
            <div className="timer-digits">{countdownStr}</div>
          </div>

          <div className="contest-rules">
            <h3>Contest Details</h3>
            <ul>
              <li><strong>Duration:</strong> {Math.floor(contest.durationSeconds / 60)} minutes</li>
              <li><strong>Problems:</strong> {contest.problems.length}</li>
              <li><strong>Time:</strong> {new Date(contest.startTime).toLocaleString()}</li>
            </ul>
          </div>

          <div className="participant-count">
            {participants.length} Participant{participants.length !== 1 ? 's' : ''} joined
          </div>
        </div>
      </div>
    );
  }

  const currentProblem = contest?.problems[currentProblemIndex];

  return (
    <div className="contest-container">
      {/* Header */}
      <div className="contest-header">
        <div className="contest-title">
          <h1>🏆 {contest.name}</h1>
        </div>
        <div className="header-center">
          <button className="btn-leaderboard" onClick={() => navigate(`/contest/${contestCode}/leaderboard?name=${userName}`)}>
            🏅 View Leaderboard
          </button>
        </div>
        <div className="header-timer">
          <ContestTimer
            startTime={contest.startTime}
            totalDuration={contest.durationSeconds}
            onTimeUp={() => alert('Contest time is up!')}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="contest-content">
        {/* Problem Statement */}
        <div className="problem-section">
          <h2 className="problem-title">{currentProblem?.title}</h2>
          <div className="problem-description">
            {currentProblem?.description}
          </div>
        </div>

        {/* Code Editor Section */}
        <div className="editor-section">
          <div className="editor-header">
            <div className="language-selector">
              <label>Language:</label>
              <select value={language} onChange={handleLanguageChange}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="400px"
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

          <div className="editor-actions">
            <button
              className="btn-run"
              onClick={handleRun}
              disabled={loading}
            >
              {loading ? '⏳ Running...' : '▶️ Run'}
            </button>
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '⏳ Submitting...' : '🚀 Submit'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="results-section">
          {testResults.length > 0 && (
            <div className="test-results">
              <h4>Test Case Results</h4>
              <div className="results-grid">
                {testResults.map((result, idx) => (
                  <div key={idx} className={`result-item-wrapper`}>
                    <div className={`result-item ${result.passed ? 'passed' : 'failed'}`}>
                      <span className="result-status">{result.status}</span>
                      <span className="result-detail">Test Case {result.index}</span>
                    </div>
                    {!result.passed && (
                      <div className="result-error-detail">
                        <div className="detail-row"><strong>Input:</strong> <code>{result.input || 'None'}</code></div>
                        <div className="detail-row"><strong>Expected:</strong> <code>{result.expectedOutput}</code></div>
                        <div className="detail-row"><strong>Actual:</strong> <code>{result.userOutput || (result.error ? result.status : 'No output')}</code></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={`output-display ${outputType}`}>
            {output || 'Output will appear here...'}
          </div>
        </div>

        {/* Custom Input & Output */}
        <div className="custom-section">
          <div className="custom-header">
            <h4>🧪 Custom Input & Output</h4>
            <button
              className="btn-run-custom"
              onClick={handleRunCustom}
              disabled={loading}
            >
              {loading ? '⏳ Running...' : '▶️ Run Custom'}
            </button>
          </div>
          <div className="custom-io-grid">
            <div className="custom-input">
              <label>Input:</label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your custom input here...&#10;Example: 1 2 3 4 5"
                disabled={loading}
              />
            </div>
            <div className="custom-output">
              <label>Output:</label>
              <div className={`output-area ${customOutputType}`}>
                {customOutput || 'Output will appear here...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contest;
