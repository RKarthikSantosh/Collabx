import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import './Leaderboard.css';

function LeaderboardPage() {
  const { contestCode } = useParams();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name');
  const navigate = useNavigate();
  
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userName) {
      navigate('/');
      return;
    }

    const fetchContest = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/contests/${contestCode}`);
        if (!response.ok) {
          throw new Error('Contest not found');
        }
        const data = await response.json();
        setContest(data);
      } catch (error) {
        console.error('Error fetching contest:', error);
        alert('Could not load leaderboard for this contest.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [contestCode, userName, navigate]);

  if (loading) {
    return (
      <div className="contest-loading">
        <div className="spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-page-header">
        <button className="back-btn-leaderboard" onClick={() => navigate(`/contest/${contestCode}?name=${userName}`)}>
          ← Back to Contest
        </button>
        <h1>🏆 {contest?.name} - Leaderboard</h1>
      </div>
      
      <div className="leaderboard-page-content">
        <Leaderboard 
          participants={contest?.participants || []} 
          currentUserName={userName} 
        />
      </div>
    </div>
  );
}

export default LeaderboardPage;
