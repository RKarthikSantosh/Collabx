import './Leaderboard.css';

function Leaderboard({ participants = [], currentUserName = '' }) {
  const sortedParticipants = [...participants].sort((a, b) => {
    // First by problems solved
    if (b.problemsSolved !== a.problemsSolved) {
      return b.problemsSolved - a.problemsSolved;
    }
    // Then by time taken
    return a.timeTaken - b.timeTaken;
  });

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatSubmissionTime = (timestamp) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };


  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h3>🏆 Live Leaderboard</h3>
        <span className="participant-count">{participants.length} participants</span>
      </div>

      <div className="leaderboard-table">
        <div className="leaderboard-row header-row">
          <div className="col rank">Rank</div>
          <div className="col name">User</div>
          <div className="col problems">Problems Solved</div>
          <div className="col time">Duration</div>
          <div className="col submitted">Submitted At</div>
          <div className="col score">Score</div>
        </div>

        {sortedParticipants.map((participant, index) => (
          <div 
            key={participant.id || index} 
            className={`leaderboard-row ${currentUserName === participant.name ? 'current-user' : ''}`}
          >
            <div className="col rank">
              <span className={`rank-badge rank-${index + 1}`}>
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && (index + 1)}
              </span>
            </div>
            <div className="col name">
              <span className="user-name">{participant.name}</span>
              {currentUserName === participant.name && <span className="you-badge">YOU</span>}
            </div>
            <div className="col problems">
              <span className="problems-count">{participant.problemsSolved}</span>
            </div>
            <div className="col time">
              <span className="time-value">{formatTime(participant.timeTaken)}</span>
            </div>
            <div className="col submitted">
              <span className="time-value">{formatSubmissionTime(participant.lastSubmissionTime)}</span>
            </div>
            <div className="col score">
              <span className="score-value">{participant.score || 0}</span>
            </div>
          </div>
        ))}

        {participants.length === 0 && (
          <div className="leaderboard-empty">
            <p>Waiting for participants...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
