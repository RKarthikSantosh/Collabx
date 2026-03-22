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
  const [code, setCode] = useState('// Start coding...');
  const [language, setLanguage] = useState('javascript');
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

  const executeTests = async (isSubmit) => {
    if (!contest) return;

    setLoading(true);
    setTestResults([]);
    setOutput(isSubmit ? 'Running all test cases...' : 'Running sample test cases...');

    try {
      const problem = contest.problems[currentProblemIndex];
      // Note: If Run, just execute first testcase. If Submit, execute all testcases.
      const testCasesToRun = isSubmit ? problem.testCases : [problem.testCases[0]];
      
      const newTestResults = [];
      let allPassed = true;

      for (let idx = 0; idx < testCasesToRun.length; idx++) {
        const testCase = testCasesToRun[idx];
        const result = await submitCode(code, language, testCase.input || '');
        
        const userOutput = result.output?.trim() || '';
        const expectedOutput = testCase.output.trim();
        const passed = result.success && (userOutput === expectedOutput);

        if (!passed) allPassed = false;

        newTestResults.push({
          index: idx + 1,
          passed,
          input: testCase.input,
          expectedOutput,
          userOutput,
          status: passed ? '✓ PASS' : '✗ FAIL'
        });
      }

      const message = allPassed
        ? (isSubmit ? '🎉 All test cases passed!' : '✅ Sample test case passed!')
        : `${newTestResults.filter(t => t.passed).length}/${newTestResults.length} test cases passed`;

      setTestResults(newTestResults);
      setOutput(message);
      setOutputType(allPassed ? 'success' : 'partial');

      // Send submission to server
      if (isSubmit && socketRef.current) {
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
    setLanguage(e.target.value);
    setCode('// Start coding...');
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

  const currentProblem = contest.problems[currentProblemIndex];

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
              onChange={(val) => setCode(val || '')}
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
                  <div key={idx} className={`result-item ${result.passed ? 'passed' : 'failed'}`}>
                    <span className="result-status">{result.status}</span>
                    <span className="result-detail">Test Case {result.index}</span>
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
