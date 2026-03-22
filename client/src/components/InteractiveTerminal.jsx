import React, { useState, useRef, useEffect } from 'react';
import './InteractiveTerminal.css';

const InteractiveTerminal = ({ isVisible, onClose, onInput, output, isRunning }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, history]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        // Add to command history
        setCommandHistory(prev => [...prev, input]);
        setHistoryIndex(-1);

        // Add to terminal history
        setHistory(prev => [...prev, { type: 'input', content: input }]);

        // Send input to parent
        onInput(input);

        setInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const clearTerminal = () => {
    setHistory([]);
    setCommandHistory([]);
    setHistoryIndex(-1);
  };

  if (!isVisible) return null;

  return (
    <div className="interactive-terminal-overlay">
      <div className="interactive-terminal">
        <div className="terminal-header">
          <div className="terminal-title">
            <span className="terminal-icon">🖥️</span>
            Interactive Terminal
            {isRunning && <span className="running-indicator">● Running</span>}
          </div>
          <div className="terminal-controls">
            <button className="btn-clear" onClick={clearTerminal} title="Clear Terminal">
              🗑️
            </button>
            <button className="btn-close" onClick={onClose} title="Close Terminal">
              ✕
            </button>
          </div>
        </div>

        <div className="terminal-content" ref={terminalRef}>
          <div className="terminal-welcome">
            Interactive code execution terminal. Type input and press Enter.
            {isRunning && <div className="waiting-input">Program is waiting for input...</div>}
          </div>

          {history.map((item, index) => (
            <div key={index} className={`terminal-line ${item.type}`}>
              {item.type === 'input' && <span className="terminal-prompt">&gt; </span>}
              <span className="terminal-content">{item.content}</span>
            </div>
          ))}

          {output && (
            <div className="terminal-line output">
              <span className="terminal-content">{output}</span>
            </div>
          )}

          {isRunning && (
            <div className="terminal-input-line">
              <span className="terminal-prompt">&gt; </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="terminal-input"
                placeholder="Enter input..."
                disabled={!isRunning}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveTerminal;