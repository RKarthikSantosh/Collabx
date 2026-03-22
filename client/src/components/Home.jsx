import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function ContestCard({ contest, userName, onJoin }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isStarted = now >= contest.startTime;
  const isEnded = now >= (contest.startTime + (contest.durationSeconds * 1000));
  
  const secondsToStart = Math.max(0, Math.floor((contest.startTime - now) / 1000));
  const h = Math.floor(secondsToStart / 3600);
  const m = Math.floor((secondsToStart % 3600) / 60);
  const s = secondsToStart % 60;
  const countdownStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className={`contest-list-card ${isEnded ? 'ended' : isStarted ? 'active' : 'upcoming'}`}>
      <div className="card-top">
        <div className="status-dot"></div>
        <span className="status-text">{isEnded ? 'CONTEST ENDED' : isStarted ? 'CONTEST LIVE' : 'UPCOMING'}</span>
      </div>
      <h3 className="card-name">{contest.name}</h3>
      <div className="card-details">
        <div className="detail-item">
          <span className="label">Starts:</span>
          <span className="value">{new Date(contest.startTime).toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="label">Participants:</span>
          <span className="value">{contest.participantCount}</span>
        </div>
      </div>

      {!isStarted && !isEnded && (
        <div className="list-countdown">
          <span className="label">Starts in:</span>
          <span className="timer">{countdownStr}</span>
        </div>
      )}

      <div className="card-actions">
        <button 
          className={`btn-card-join ${!isStarted || isEnded ? 'disabled' : ''}`}
          disabled={!isStarted || isEnded}
          onClick={() => onJoin(contest.code)}
        >
          {isEnded ? 'Ended' : isStarted ? 'Join Now' : 'Join Early'}
        </button>
      </div>
    </div>
  );
}

function Home() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState(null); 
  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [contests, setContests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'contest') {
      fetchContests();
    }
  }, [mode]);

  const fetchContests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/contests');
      setContests(res.data);
    } catch (err) {
      console.error('Error fetching contests');
    }
  };

  const handleCreateRoom = async () => {
    if (!name.trim()) return alert('Please enter your name');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/rooms', { name });
      navigate(`/room/${res.data.code}?name=${name}`);
    } catch (err) { alert('Error creating room'); } finally { setLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (!name.trim() || !roomCode.trim()) return alert('Please enter name and room code');
    setLoading(true);
    try {
      await axios.get(`http://localhost:5000/api/rooms/${roomCode}`);
      navigate(`/room/${roomCode}?name=${name}`);
    } catch (err) { alert('Room not found'); } finally { setLoading(false); }
  };

  const handleCreateContest = () => {
    if (!name.trim()) return alert('Please enter your name');
    navigate(`/contest/create?name=${name}`);
  };

  const handleJoinContest = async (code) => {
    const finalCode = code || contestCode;
    if (!name.trim() || !finalCode.trim()) return alert('Please enter your name and a contest code');
    setLoading(true);
    try {
      await axios.get(`http://localhost:5000/api/contests/${finalCode}`);
      navigate(`/contest/${finalCode}?name=${name}`);
    } catch (err) {
      alert('Contest not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      {!mode ? (
        <div className="homepage-hero">
          <div className="hero-content">
            <h1 className="hero-logo">Collab<span>X</span></h1>
            <p className="hero-tagline">Real-time collaborative coding and competitive programming platform.</p>
            
            <div className="hero-main-input">
              <input 
                type="text" 
                placeholder="Enter your name to start..." 
                value={name} 
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="hero-cards">
              <div className="hero-card collab" onClick={() => name ? setMode('collab') : alert('Enter name first!')}>
                <div className="card-icon">👥</div>
                <h2>Collab Mode</h2>
                <p>Pair program in real-time with shared editor and chat.</p>
                <div className="card-btn">Open Editor</div>
              </div>
              
              <div className="hero-card contest" onClick={() => name ? setMode('contest') : alert('Enter name first!')}>
                <div className="card-icon">🏆</div>
                <h2>Contest Mode</h2>
                <p>Host or join coding challenges with live leaderboards.</p>
                <div className="card-btn">Browse Contests</div>
              </div>
            </div>
          </div>
          
          <div className="hero-footer">
            Built for developers, by Antigravity Agent.
          </div>
        </div>
      ) : mode === 'collab' ? (
        <div className="home-card glass">
          <button className="back-btn-top" onClick={() => setMode(null)}>← Home</button>
          <div className="card-header">
            <div className="header-icon">👥</div>
            <h1>Collaborative Coding</h1>
          </div>
          <div className="button-group-hero">
            <button className="btn-hero-primary" onClick={handleCreateRoom} disabled={loading}>
              {loading ? 'Starting...' : 'Create Instant Room'}
            </button>
            <div className="divider"><span>OR</span></div>
            <div className="hero-inline-join">
               <input 
                type="text" 
                placeholder="Enter Room Code" 
                value={contestCode} 
                onChange={(e) => setContestCode(e.target.value.toUpperCase())}
               />
               <button onClick={handleJoinRoom}>Join</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="home-card contest-view">
          <button className="back-btn-top" onClick={() => setMode(null)}>← Home</button>
          <div className="contest-page-header">
             <div className="title-section">
                <h1>Active & Upcoming Contests</h1>
                <p>Select a contest to join or schedule a new one.</p>
             </div>
             <button className="btn-create-header" onClick={handleCreateContest}>+ Create Contest</button>
          </div>

          <div className="contest-grid">
             {contests.length === 0 ? (
               <div className="no-contests">
                 <p>No active contests found. Why not create one?</p>
               </div>
             ) : (
               contests.map(c => (
                 <ContestCard key={c.code} contest={c} userName={name} onJoin={handleJoinContest} />
               ))
             )}
          </div>
          
          <div className="manual-join-footer">
             <span>Have a private invite code?</span>
             <input type="text" placeholder="CODE" value={contestCode} onChange={(e) => setContestCode(e.target.value.toUpperCase())} maxLength="6" />
             <button onClick={() => handleJoinContest()}>Join</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;