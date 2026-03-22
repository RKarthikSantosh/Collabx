import { useEffect, useState } from 'react';
import './ContestTimer.css';

function ContestTimer({ startTime, totalDuration, onTimeUp = () => {} }) {
  const [timeRemaining, setTimeRemaining] = useState(totalDuration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, totalDuration - elapsed);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsActive(false);
        onTimeUp();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, totalDuration, onTimeUp]);

  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const percentage = ((totalDuration - timeRemaining) / totalDuration) * 100;
  const isWarning = timeRemaining < 300; // 5 minutes
  const isCritical = timeRemaining < 60; // 1 minute

  return (
    <div className={`contest-timer ${!isActive ? 'finished' : ''} ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-display">
        <span className="timer-label">Time Remaining</span>
        <div className="timer-value">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <div className="timer-progress-bar">
        <div className="timer-progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      {isCritical && isActive && (
        <div className="timer-critical-alert">⚠️ Contest ending soon!</div>
      )}
    </div>
  );
}

export default ContestTimer;
