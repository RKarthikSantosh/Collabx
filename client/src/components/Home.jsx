import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function Home() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState(null); // 'collab', 'contest-create', 'contest-join', null
  const [roomCode, setRoomCode] = useState('');
  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!name.trim()) return alert('Please enter your name');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/rooms', { name });
      navigate(`/room/${res.data.code}?name=${name}`);
    } catch (err) {
      alert('Error creating room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!name.trim() || !roomCode.trim()) return alert('Please enter name and room code');
    setLoading(true);
    try {
      await axios.get(`http://localhost:5000/api/rooms/${roomCode}`);
      navigate(`/room/${roomCode}?name=${name}`);
    } catch (err) {
      alert('Room not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = () => {
    if (!name.trim()) return alert('Please enter your name');
    navigate(`/contest/create?name=${name}`);
  };

  const handleJoinContest = async () => {
    if (!name.trim() || !contestCode.trim()) return alert('Please enter name and contest code');
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/contests/${contestCode}`);
      navigate(`/contest/${contestCode}?name=${name}`);
    } catch (err) {
      alert('Contest not found');
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="home-container">
        <div className="feature-selection">
          <h1>🚀 CollabX</h1>
          <p>Choose your mode</p>
          
          <div className="feature-cards">
            <div 
              className="feature-card collab-card" 
              onClick={() => setMode('collab')}
            >
              <div className="feature-icon">👥</div>
              <h2>Collaborative Coding</h2>
              <p>Code together in real-time with your team</p>
              <div className="feature-perks">
                <div>✓ Real-time sync</div>
                <div>✓ Multi-user cursors</div>
                <div>✓ Live chat</div>
              </div>
            </div>

            <div 
              className="feature-card contest-card" 
              onClick={() => setMode('contest')}
            >
              <div className="feature-icon">🏆</div>
              <h2>Contests & Challenges</h2>
              <p>Compete with others and challenge your skills</p>
              <div className="feature-perks">
                <div>✓ Live leaderboards</div>
                <div>✓ Timed contests</div>
                <div>✓ Test case validation</div>
              </div>
            </div>
          </div>

          <div className="mode-navigation">
            <button className="back-btn" onClick={() => {}}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Collaborative Coding Mode
  if (mode === 'collab') {
    return (
      <div className="home-container">
        <div className="home-card">
          <button className="back-btn" onClick={() => setMode(null)}>← Back to Mode Selection</button>
          
          <h1>👥 Collaborative Coding</h1>
          <p>Code together, create better</p>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
          </div>

          <div className="button-group">
            <button 
              className="btn-primary" 
              onClick={handleCreateRoom}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setMode('collab-join')}
            >
              Join Room
            </button>
          </div>

          {mode === 'collab-join' && (
            <div className="join-section">
              <h3>Join Existing Room</h3>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                maxLength="6"
              />
              <button 
                className="join-btn"
                onClick={handleJoinRoom}
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Contest Mode Selection
  if (mode === 'contest') {
    return (
      <div className="home-container">
        <div className="home-card">
          <button className="back-btn" onClick={() => setMode(null)}>← Back to Mode Selection</button>
          
          <h1>🏆 Contests & Challenges</h1>
          <p>Test your coding skills</p>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="button-group">
            <button 
              className="btn-primary" 
              onClick={handleCreateContest}
              disabled={!name.trim()}
            >
              Create Contest
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setMode('contest-join')}
            >
              Join Contest
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Contest Join Mode
  if (mode === 'contest-join') {
    return (
      <div className="home-container">
        <div className="home-card">
          <button className="back-btn" onClick={() => setMode('contest')}>← Back</button>
          
          <h1>🏆 Join Contest</h1>
          <p>Enter the contest code to join</p>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter contest code"
              value={contestCode}
              onChange={(e) => setContestCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinContest()}
              maxLength="6"
            />
          </div>

          <button 
            className="btn-primary"
            onClick={handleJoinContest}
            disabled={loading || !contestCode.trim()}
          >
            {loading ? 'Joining...' : 'Join Contest'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default Home;