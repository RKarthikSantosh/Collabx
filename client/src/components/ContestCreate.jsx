import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './ContestCreate.css';

function ContestCreate() {
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Initial Info, 1: Dashboard
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);
  
  // Time Scroller State
  const [showStartTimeScroller, setShowStartTimeScroller] = useState(false);
  const [showEndTimeScroller, setShowEndTimeScroller] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  
  const [formData, setFormData] = useState({
    contestName: '',
    startDate: todayStr,
    startTime: timeStr,
    endDate: todayStr,
    endTime: '23:59',
    noEndTime: false,
    organizationType: 'School',
    organizationName: '',
    durationMinutes: 60,
    problems: [
      { title: 'New Problem', description: '', difficulty: 'easy', score: 100, testCases: [] }
    ]
  });

  useEffect(() => {
    if (formData.noEndTime) {
      setFormData(prev => ({ ...prev, durationMinutes: 1440 }));
      return;
    }
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(`${formData.endDate}T${formData.endTime}`);
      const diffMs = end - start;
      if (diffMs > 0) {
        setFormData(prev => ({ ...prev, durationMinutes: Math.floor(diffMs / 60000) }));
      }
    }
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime, formData.noEndTime]);

  const handleCreateContest = async () => {
    if (!formData.contestName.trim()) { alert('Please enter a contest name'); return; }
    if (formData.problems.some(p => !p.description.trim())) { alert('Please add descriptions for all problems'); return; }
    if (formData.problems.some(p => p.testCases.length === 0)) { alert('Please add at least one test case to each problem'); return; }

    setLoading(true);
    try {
      const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
      const res = await axios.post('http://localhost:5000/api/contests', {
        name: formData.contestName,
        createdBy: userName,
        problems: formData.problems,
        durationSeconds: formData.durationMinutes * 60,
        organization: formData.organizationName,
        startTime: startTimestamp
      });
      navigate(`/contest/${res.data.code}?name=${userName}`);
    } catch (err) {
      alert('Error creating contest: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddProblem = () => {
    if (formData.problems.length < 10) {
      const newIdx = formData.problems.length;
      setFormData(prev => ({
        ...prev,
        problems: [...prev.problems, { title: 'New Problem', description: '', difficulty: 'medium', score: 100, testCases: [] }]
      }));
      setSelectedProblemIdx(newIdx);
    }
  };

  const handleRemoveProblem = (index, e) => {
    e.stopPropagation();
    if (formData.problems.length > 1) {
      const newProblems = formData.problems.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, problems: newProblems }));
      if (selectedProblemIdx >= newProblems.length) { setSelectedProblemIdx(newProblems.length - 1); }
    }
  };

  const handleProblemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const handleAddTestCase = (pIdx) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) => i === pIdx ? { ...p, testCases: [...p.testCases, { input: '', output: '' }] } : p)
    }));
  };

  const handleTestCaseChange = (pIdx, tIdx, field, value) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) => i === pIdx ? {
        ...p,
        testCases: p.testCases.map((t, j) => j === tIdx ? { ...t, [field]: value } : t)
      } : p)
    }));
  };

  const handleRemoveTestCase = (pIdx, tIdx) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.map((p, i) => i === pIdx ? { ...p, testCases: p.testCases.filter((_, j) => j !== tIdx) } : p)
    }));
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  };

  const TimeScroller = ({ value, onChange, onClose }) => {
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
    
    const [h, m] = value.split(':');

    return (
      <div className="time-scroller-dropdown">
        <div className="scroller-columns">
          <div className="scroller-col">
            <label>HR</label>
            <div className="scroller-list">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className={`scroller-item ${h === hour ? 'active' : ''}`}
                  onClick={() => onChange(`${hour}:${m}`)}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>
          <div className="scroller-col">
            <label>MIN</label>
            <div className="scroller-list">
              {minutes.map(min => (
                <div 
                  key={min} 
                  className={`scroller-item ${m === min ? 'active' : ''}`}
                  onClick={() => {
                    onChange(`${h}:${min}`);
                    onClose();
                  }}
                >
                  {min}
                </div>
              ))}
            </div>
          </div>
        </div>
        <button className="scroller-done" onClick={onClose}>Done</button>
      </div>
    );
  };

  if (step === 0) {
    return (
      <div className="contest-wizard-container">
        <div className="wizard-card">
          <h1 className="wizard-title">Create Contest</h1>
          <p className="wizard-description">
            Host your own coding contest on CollabX. You can practice and compete with friends from your organization or school. Select from our library of over 1,500 coding challenges or create your own.
            <br />
            <span className="sub-description">Get started by providing the initial details for your contest.</span>
          </p>

          <form className="wizard-form" onSubmit={(e) => { 
            e.preventDefault(); 
            if (formData.durationMinutes <= 0 && !formData.noEndTime) {
              alert('End time must be after start time');
              return;
            }
            setStep(1); 
          }}>
            <div className="wizard-field">
              <label>Contest Name <span className="required">*</span></label>
              <div className="input-wrapper">
                <input type="text" required value={formData.contestName} onChange={(e) => setFormData({ ...formData, contestName: e.target.value })} />
              </div>
            </div>

            <div className="wizard-field">
              <label>Start Time <span className="required">*</span></label>
              <div className="input-row">
                <div className="date-input-container">
                  <input type="date" className="hidden-date-picker" id="startDate" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                  <div className="custom-date-display" onClick={() => document.getElementById('startDate').showPicker()}>
                    {formatDateDisplay(formData.startDate) || 'DD-MM-YYYY'}
                    <span className="calendar-icon">📅</span>
                  </div>
                </div>
                <span className="at">at</span>
                <div className="time-input-container">
                  <div className="custom-time-display" onClick={() => setShowStartTimeScroller(!showStartTimeScroller)}>
                    {formData.startTime}
                    <span className="time-icon">🕒</span>
                  </div>
                  {showStartTimeScroller && (
                    <TimeScroller 
                      value={formData.startTime} 
                      onChange={(val) => setFormData({...formData, startTime: val})} 
                      onClose={() => setShowStartTimeScroller(false)}
                    />
                  )}
                </div>
                <span className="tz">IST <span className="help-icon" title="Indian Standard Time">?</span></span>
              </div>
            </div>

            <div className="wizard-field">
              <label>End Time <span className="required">*</span></label>
              <div className="input-row-group">
                <div className="input-row">
                  <div className="date-input-container">
                    <input type="date" className="hidden-date-picker" id="endDate" disabled={formData.noEndTime} value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                    <div className={`custom-date-display ${formData.noEndTime ? 'disabled' : ''}`} onClick={() => !formData.noEndTime && document.getElementById('endDate').showPicker()}>
                      {formatDateDisplay(formData.endDate) || 'DD-MM-YYYY'}
                      <span className="calendar-icon">📅</span>
                    </div>
                  </div>
                  <span className="at">at</span>
                  <div className="time-input-container">
                    <div 
                      className={`custom-time-display ${formData.noEndTime ? 'disabled' : ''}`} 
                      onClick={() => !formData.noEndTime && setShowEndTimeScroller(!showEndTimeScroller)}
                    >
                      {formData.endTime}
                      <span className="time-icon">🕒</span>
                    </div>
                    {showEndTimeScroller && !formData.noEndTime && (
                      <TimeScroller 
                        value={formData.endTime} 
                        onChange={(val) => setFormData({...formData, endTime: val})} 
                        onClose={() => setShowEndTimeScroller(false)}
                      />
                    )}
                  </div>
                  <span className="tz">IST <span className="help-icon">?</span></span>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="no-end-time" checked={formData.noEndTime} onChange={(e) => setFormData({...formData, noEndTime: e.target.checked})} />
                  <label htmlFor="no-end-time" className="checkbox-label">This contest has no end time.</label>
                </div>
              </div>
            </div>

            <div className="wizard-field">
              <label>Organization Type <span className="required">*</span></label>
              <div className="input-wrapper">
                <select value={formData.organizationType} onChange={(e) => setFormData({...formData, organizationType: e.target.value})}>
                  <option value="School">School</option>
                  <option value="University">University</option>
                  <option value="Company">Company</option>
                  <option value="Community">Community</option>
                </select>
              </div>
            </div>

            <div className="wizard-field">
              <label>Organization Name <span className="required">*</span></label>
              <div className="input-wrapper">
                <input type="text" required value={formData.organizationName} onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="btn-get-started">Get Started</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="contest-create-page">
      <div className="admin-header">
        <div className="header-left">
          <h2 className="header-contest-title">{formData.contestName || 'Untitled Contest'}</h2>
        </div>
        <div className="header-right">
          <button className="btn-save-exit" onClick={handleCreateContest} disabled={loading}>
            {loading ? 'Creating...' : 'Create & Exit'}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className="tab-btn active">Problems ({formData.problems.length})</button>
        <button className="tab-btn" onClick={() => setStep(0)}>Settings</button>
      </div>

      <div className="admin-content">
        <div className="tab-panel problems-panel">
          <div className="sidebar">
            <div className="sidebar-header">
              <h4>Problem List</h4>
              <button className="btn-add-circle" onClick={handleAddProblem}>+</button>
            </div>
            <div className="problem-list">
              {formData.problems.map((p, idx) => (
                <div key={idx} className={`problem-tab ${selectedProblemIdx === idx ? 'active' : ''}`} onClick={() => setSelectedProblemIdx(idx)}>
                  <span className="p-idx">{idx + 1}</span>
                  <span className="p-title">{p.title || 'Untitled'}</span>
                  <button className="p-remove" onClick={(e) => handleRemoveProblem(idx, e)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="problem-detail">
            <div className="detail-card">
              <div className="detail-header">
                <input type="text" className="title-input-large" value={formData.problems[selectedProblemIdx].title} onChange={(e) => handleProblemChange(selectedProblemIdx, 'title', e.target.value)} placeholder="Problem Title" />
                <div className="score-badge">
                  <label>Points</label>
                  <input type="number" value={formData.problems[selectedProblemIdx].score} onChange={(e) => handleProblemChange(selectedProblemIdx, 'score', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="detail-body">
                <div className="form-group">
                  <label>Difficulty</label>
                  <div className="difficulty-pills">
                    {['easy', 'medium', 'hard'].map(d => (
                      <button key={d} className={`pill ${formData.problems[selectedProblemIdx].difficulty === d ? d : ''}`} onClick={() => handleProblemChange(selectedProblemIdx, 'difficulty', d)}>
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Problem Description</label>
                  <textarea value={formData.problems[selectedProblemIdx].description} onChange={(e) => handleProblemChange(selectedProblemIdx, 'description', e.target.value)} placeholder="Describe the challenge..." rows="8" />
                </div>
                <div className="test-cases-section">
                  <div className="tc-header">
                    <h4>Test Cases</h4>
                    <button className="btn-outline-small" onClick={() => handleAddTestCase(selectedProblemIdx)}>+ Add Case</button>
                  </div>
                  <div className="tc-list">
                    {formData.problems[selectedProblemIdx].testCases.map((tc, tcIdx) => (
                      <div key={tcIdx} className="tc-row">
                        <div className="tc-input-group"><label>Input</label><textarea value={tc.input} onChange={(e) => handleTestCaseChange(selectedProblemIdx, tcIdx, 'input', e.target.value)} /></div>
                        <div className="tc-input-group"><label>Output</label><textarea value={tc.output} onChange={(e) => handleTestCaseChange(selectedProblemIdx, tcIdx, 'output', e.target.value)} /></div>
                        <button className="tc-remove" onClick={() => handleRemoveTestCase(selectedProblemIdx, tcIdx)}>🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-footer">
        <div className="footer-left"><span>{formData.numProblems} Problems | Total Score: {formData.problems.reduce((sum, p) => sum + (p.score || 0), 0)}</span></div>
        <div className="footer-right">
          <button className="btn-cancel-admin" onClick={() => navigate('/')}>Discard</button>
          <button className="btn-create-final" onClick={handleCreateContest} disabled={loading}>{loading ? 'Creating...' : 'Create Contest'}</button>
        </div>
      </div>
    </div>
  );
}

export default ContestCreate;
