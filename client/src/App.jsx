import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Room from './components/Room';
import ContestCreate from './components/ContestCreate';
import Contest from './components/Contest';
import LeaderboardPage from './components/LeaderboardPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomCode" element={<Room />} />
        <Route path="/contest/create" element={<ContestCreate />} />
        <Route path="/contest/:contestCode" element={<Contest />} />
        <Route path="/contest/:contestCode/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
