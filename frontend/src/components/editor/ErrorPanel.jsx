import React, { useState } from 'react';
import './error-panel.css';

const ErrorPanel = ({ errors, language, onErrorClick }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all', 'error', 'warning'

  // Filter errors based on severity
  const filteredErrors = errors.filter(error => {
    if (filterSeverity === 'all') return true;
    return error.severity === filterSeverity;
  });

  // Count errors and warnings
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  if (errors.length === 0) {
    return (
      <div className="error-panel error-panel-empty">
        <div className="error-panel-header">
          <div className="error-panel-title">
            <span className="error-icon">✓</span>
            <span>No Errors</span>
          </div>
          <button 
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
        </div>
        {!collapsed && (
          <div className="error-panel-body">
            <p className="success-message">Your code looks good! No syntax errors detected.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="error-panel">
      <div className="error-panel-header">
        <div className="error-panel-title">
          <span className="error-panel-icon">⚠</span>
          <span>
            {errorCount > 0 && <span className="error-count">{errorCount}</span>}
            {warningCount > 0 && <span className="warning-count">{warningCount}</span>}
            <span className="error-panel-label">Issues Found</span>
          </span>
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="error-filter">
            <button 
              className={`filter-btn ${filterSeverity === 'all' ? 'active' : ''}`}
              onClick={() => setFilterSeverity('all')}
            >
              All ({errors.length})
            </button>
            <button 
              className={`filter-btn ${filterSeverity === 'error' ? 'active' : ''}`}
              onClick={() => setFilterSeverity('error')}
            >
              Errors ({errorCount})
            </button>
            <button 
              className={`filter-btn ${filterSeverity === 'warning' ? 'active' : ''}`}
              onClick={() => setFilterSeverity('warning')}
            >
              Warnings ({warningCount})
            </button>
          </div>

          <div className="error-panel-body">
            {filteredErrors.length === 0 ? (
              <p className="no-items-message">No {filterSeverity}s to display</p>
            ) : (
              <div className="error-list">
                {filteredErrors.map((error, index) => (
                  <div
                    key={index}
                    className={`error-item ${error.severity}`}
                    onClick={() => onErrorClick && onErrorClick(error)}
                  >
                    <div className="error-item-header">
                      <span className={`error-severity-badge ${error.severity}`}>
                        {error.severity === 'error' ? '✕' : '⚠'}
                      </span>
                      <span className="error-location">
                        Line {error.startLineNumber}, Col {error.startColumn}
                      </span>
                    </div>
                    <div className="error-item-message">
                      <p>{error.message}</p>
                    </div>
                    <div className="error-item-source">
                      <small>{error.source || language}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ErrorPanel;
