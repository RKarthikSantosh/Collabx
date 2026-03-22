import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './ContestCreate.css';

function ContestCreate() {
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    contestName: '',
    numProblems: 1,
    durationMinutes: 60,
    problems: [
      { title: 'Problem 1', description: '', difficulty: 'easy', score: 100, testCases: [] }
    ]
  });

  const handleAddProblem = () => {
    if (formData.problems.length < 5) {
      setFormData(prev => ({
        ...prev,
        numProblems: prev.numProblems + 1,
        problems: [
          ...prev.problems,
          {
            title: `Problem ${prev.problems.length + 1}`,
            description: '',
            difficulty: 'medium',
            score: 100,
            testCases: []
          }
        ]
      }));
    }
  };

  const handleRemoveProblem = (index) => {
    if (formData.problems.length > 1) {
      setFormData(prev => ({
        ...prev,
        numProblems: prev.numProblems - 1,
        problems: prev.problems.filter((_, i) => i !== index)
      }));
    }
  };

  const handleProblemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleAddTestCase = (problemIndex) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) =>
        i === problemIndex
          ? {
              ...p,
              testCases: [...p.testCases, { input: '', output: '' }]
            }
          : p
      )
    }));
  };

  const handleTestCaseChange = (problemIndex, testIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) =>
        i === problemIndex
          ? {
              ...p,
              testCases: p.testCases.map((t, j) =>
                j === testIndex ? { ...t, [field]: value } : t
              )
            }
          : p
      )
    }));
  };

  const handleRemoveTestCase = (problemIndex, testIndex) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) =>
        i === problemIndex
          ? {
              ...p,
              testCases: p.testCases.filter((_, j) => j !== testIndex)
            }
          : p
      )
    }));
  };

  const handleCreateContest = async () => {
    if (!formData.contestName.trim()) {
      alert('Please enter a contest name');
      return;
    }

    if (formData.problems.some(p => !p.description.trim())) {
      alert('Please add descriptions for all problems');
      return;
    }

    if (formData.problems.some(p => p.testCases.length === 0)) {
      alert('Please add at least one test case to each problem');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/contests', {
        name: formData.contestName,
        createdBy: userName,
        problems: formData.problems,
        durationSeconds: formData.durationMinutes * 60
      });

      navigate(`/contest/${res.data.code}?name=${userName}`);
    } catch (err) {
      alert('Error creating contest: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contest-create-container">
      <button className="back-btn-create" onClick={() => navigate('/')}>← Back Home</button>

      <div className="contest-create-card">
        <h1>🏆 Create Contest</h1>
        <p>Set up your coding challenge</p>

        <div className="form-section">
          <label>Contest Name</label>
          <input
            type="text"
            value={formData.contestName}
            onChange={(e) => setFormData(prev => ({ ...prev, contestName: e.target.value }))}
            placeholder="e.g., Weekly Challenge #1"
          />
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>Number of Problems</label>
            <span className="problem-count">{formData.numProblems}</span>
          </div>
          <div className="form-section">
            <label>Duration (minutes)</label>
            <input
              type="number"
              min="10"
              max="480"
              value={formData.durationMinutes}
              onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <div className="problems-section">
          <div className="section-header">
            <h2>Problems</h2>
            <button
              className="btn-add-problem"
              onClick={handleAddProblem}
              disabled={formData.problems.length >= 5}
            >
              + Add Problem
            </button>
          </div>

          {formData.problems.map((problem, pIdx) => (
            <div key={pIdx} className="problem-card">
              <div className="problem-header">
                <h3>Problem {pIdx + 1}</h3>
                {formData.problems.length > 1 && (
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveProblem(pIdx)}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-section">
                  <label>Title</label>
                  <input
                    type="text"
                    value={problem.title}
                    onChange={(e) => handleProblemChange(pIdx, 'title', e.target.value)}
                    placeholder="Problem title"
                  />
                </div>
                <div className="form-section">
                  <label>Difficulty</label>
                  <select
                    value={problem.difficulty}
                    onChange={(e) => handleProblemChange(pIdx, 'difficulty', e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-section">
                  <label>Score</label>
                  <input
                    type="number"
                    min="1"
                    value={problem.score}
                    onChange={(e) => handleProblemChange(pIdx, 'score', parseInt(e.target.value) || 0)}
                    placeholder="Points"
                  />
                </div>
              </div>

              <div className="form-section">
                <label>Description</label>
                <textarea
                  value={problem.description}
                  onChange={(e) => handleProblemChange(pIdx, 'description', e.target.value)}
                  placeholder="Problem description, constraints, examples..."
                  rows="4"
                />
              </div>

              <div className="testcases-section">
                <div className="section-header">
                  <h4>Test Cases ({problem.testCases.length})</h4>
                  <button
                    className="btn-add-testcase"
                    onClick={() => handleAddTestCase(pIdx)}
                    disabled={problem.testCases.length >= 10}
                  >
                    + Add Test Case
                  </button>
                </div>

                {problem.testCases.map((testCase, tIdx) => (
                  <div key={tIdx} className="testcase-row">
                    <div className="testcase-input">
                      <label>Input {tIdx + 1}</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => handleTestCaseChange(pIdx, tIdx, 'input', e.target.value)}
                        placeholder="Test input"
                        rows="2"
                      />
                    </div>
                    <div className="testcase-output">
                      <label>Expected Output {tIdx + 1}</label>
                      <textarea
                        value={testCase.output}
                        onChange={(e) => handleTestCaseChange(pIdx,tIdx, 'output', e.target.value)}
                        placeholder="Expected output"
                        rows="2"
                      />
                    </div>
                    <button
                      className="btn-remove-testcase"
                      onClick={() => handleRemoveTestCase(pIdx, tIdx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="button-group-create">
          <button
            className="btn-create-contest"
            onClick={handleCreateContest}
            disabled={loading}
          >
            {loading ? '⏳ Creating...' : '🚀 Create Contest'}
          </button>
          <button
            className="btn-cancel"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContestCreate;
