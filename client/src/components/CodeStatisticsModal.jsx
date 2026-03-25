import React from 'react';
import './CodeStatisticsModal.css';

function CodeStatisticsModal({ isOpen, onClose, stats, loading }) {
  if (!isOpen) return null;

  return (
    <div className="stats-modal-overlay">
      <div className="stats-modal-content glass-card">
        <div className="stats-modal-header">
          <h2>📊 Code Insights & Statistics</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div className="stats-loading">
            <div className="spinner"></div>
            <p>Fetching metrics from API...</p>
          </div>
        ) : (
          <div className="stats-body">
            <div className="stats-overview">
              <div className="stat-card">
                <span className="stat-label">Total Lines</span>
                <span className="stat-value">{stats.totalLines || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Characters</span>
                <span className="stat-value">{stats.totalChars || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Complexity</span>
                <span className="stat-value">{stats.complexity || 'Low'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Language</span>
                <span className="stat-value">{stats.language || 'JS'}</span>
              </div>
            </div>

            <div className="stats-chart-section">
              <h3>Language Distribution</h3>
              <div className="bar-chart">
                {stats.distribution?.map((item, index) => (
                  <div key={index} className="bar-group">
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      >
                        <span className="bar-percent">{item.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-footer-info">
              <p>Analysis Quality: Professional</p>
              <p>Last Analysis: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeStatisticsModal;
