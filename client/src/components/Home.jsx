import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function ContestCard({ contest, onJoin, onDelete, onEnd, currentUser }) {
  const [now, setNow] = useState(Date.now());
  const isCreator = currentUser?.name === contest.createdBy;

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
        {isCreator && <span className="creator-badge">Creator Control</span>}
      </div>
      <h3 className="card-name">{contest.name}</h3>
      <div className="card-details">
        <div className="detail-item"><span className="label">Starts:</span><span className="value">{new Date(contest.startTime).toLocaleString()}</span></div>
        <div className="detail-item"><span className="label">Participants:</span><span className="value">{contest.participantCount}</span></div>
      </div>
      {!isStarted && !isEnded && (
        <div className="list-countdown">
          <span className="label">Starts in:</span>
          <span className="timer">{countdownStr}</span>
        </div>
      )}
      <div className="card-actions">
        <button 
          className={`btn-card-join ${isEnded ? 'disabled' : ''}`}
          disabled={isEnded}
          onClick={() => onJoin(contest.code)}
        >
          {isEnded ? 'Ended' : isStarted ? 'Join Now' : 'Join Early'}
        </button>

        {isCreator && (
          <div className="admin-actions">
            {!isEnded && isStarted && (
              <button className="btn-admin-end" onClick={() => onEnd(contest.code)}>End Now</button>
            )}
            <button className="btn-admin-delete" onClick={() => onDelete(contest.code)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Home() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('collabx_user')));
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
  const [mode, setMode] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [contests, setContests] = useState([]);
  const [contestCode, setContestCode] = useState('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (mode === 'contest') fetchContests();
  }, [mode]);

  const fetchContests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/contests');
      setContests(res.data);
    } catch (err) { console.error('Error fetching contests'); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login' 
        ? { email, password } 
        : { name, email, password, college };
      
      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      if (authMode === 'login') {
        localStorage.setItem('collabx_user', JSON.stringify(res.data.user));
        localStorage.setItem('collabx_token', res.data.token);
        setUser(res.data.user);
      } else {
        alert('Registered successfully! Please login.');
        setAuthMode('login');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Authentication error';
      alert(`Error: ${errorMsg}`);
      console.error('Auth Error Full Detail:', err);
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('collabx_user');
    localStorage.removeItem('collabx_token');
    setUser(null);
    setMode(null);
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/rooms', { name: user.name });
      navigate(`/room/${res.data.code}?name=${user.name}`);
    } catch (err) { alert('Error creating room'); } finally { setLoading(false); }
  };

  const handleCreateContest = () => navigate(`/contest/create?name=${user.name}`);

  const handleJoinContest = async (code) => {
    const finalCode = code || contestCode;
    if (!finalCode.trim()) return alert('Please enter a contest code');
    setLoading(true);
    try {
      await axios.get(`http://localhost:5000/api/contests/${finalCode}`);
      navigate(`/contest/${finalCode}?name=${user.name}`);
    } catch (err) { alert('Contest not found'); } finally { setLoading(false); }
  };

  const handleDeleteContest = async (code) => {
    if (!window.confirm('Are you sure you want to delete this contest?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/contests/${code}?userName=${user.name}`);
      fetchContests();
    } catch (err) { alert('Error deleting contest'); }
  };

  const handleEndContest = async (code) => {
    if (!window.confirm('End this contest immediately for all?')) return;
    try {
      await axios.post(`http://localhost:5000/api/contests/${code}/end`, { userName: user.name });
      fetchContests();
    } catch (err) { alert('Error ending contest'); }
  };

  if (!user) {
    return (
      <div className="home-container">
        <div className="auth-card glass">
          <h1 className="hero-logo">Collab<span>X</span></h1>
          <p className="auth-subtitle">{authMode === 'login' ? 'Welcome back! Please login' : 'Create an account to join contests'}</p>
          
          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === 'register' && (
              <>
                <input type="text" placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
                <input type="text" placeholder="College / Organization" required value={college} onChange={(e) => setCollege(e.target.value)} />
              </>
            )}
            <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="btn-hero-primary" disabled={loading}>
              {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Signup')}
            </button>
          </form>
          
          <p className="auth-switch">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'Signup Now' : 'Login Now'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {!mode ? (
        <div className="homepage-hero">
          <div className="user-nav">
             <span>Welcome, <strong>{user.name}</strong></span>
             <button onClick={logout} className="logout-btn">Logout</button>
          </div>
          <div className="hero-content">
            <h1 className="hero-logo">Collab<span>X</span></h1>
            <p className="hero-tagline">Real-time collaborative coding and competitive programming platform.</p>
            
            <div className="hero-cards">
              <div className="hero-card collab" onClick={() => setMode('collab')}>
                <div className="card-icon">👥</div>
                <h2>Collab Mode</h2>
                <p>Pair program in real-time with shared editor and chat.</p>
                <div className="card-btn">Open Editor</div>
              </div>
              
              <div className="hero-card contest" onClick={() => setMode('contest')}>
                <div className="card-icon">🏆</div>
                <h2>Contest Mode</h2>
                <p>Host or join coding challenges with live leaderboards.</p>
                <div className="card-btn">Browse Contests</div>
              </div>
            </div>
          </div>
          <div className="hero-footer">Built with MySQL Persistence & JWT Security.</div>
        </div>
      ) : mode === 'collab' ? (
        <div className="home-card glass">
          <button className="back-btn-top" onClick={() => setMode(null)}>← Home</button>
          <div className="card-header"><div className="header-icon">👥</div><h1>Collaborative Coding</h1></div>
          <div className="button-group-hero">
            <button className="btn-hero-primary" onClick={handleCreateRoom} disabled={loading}>{loading ? 'Starting...' : 'Create Instant Room'}</button>
            <div className="divider"><span>OR</span></div>
            <div className="hero-inline-join">
               <input type="text" placeholder="Enter Room Code" value={contestCode} onChange={(e) => setContestCode(e.target.value.toUpperCase())} maxLength="6"/>
               <button onClick={() => navigate(`/room/${contestCode}?name=${user.name}`)}>Join</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="home-card contest-view">
          <button className="back-btn-top" onClick={() => setMode(null)}>← Home</button>
          <div className="contest-page-header">
             <div className="title-section"><h1>Active & Upcoming Contests</h1><p>Select a contest to join or schedule a new one.</p></div>
             <button className="btn-create-header" onClick={handleCreateContest}>+ Create Contest</button>
          </div>
          <div className="contest-grid">
             {contests.length === 0 ? <div className="no-contests"><p>No active contests found. Why not create one?</p></div> : 
               contests.map(c => (
                 <ContestCard 
                   key={c.code} 
                   contest={c} 
                   onJoin={handleJoinContest} 
                   onDelete={handleDeleteContest}
                   onEnd={handleEndContest}
                   currentUser={user}
                 />
               ))
             }
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;