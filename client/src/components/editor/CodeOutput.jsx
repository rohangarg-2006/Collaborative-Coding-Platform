import React, { useState, useCallback } from 'react';
import { executeCode } from '../../utils/codeExecutionService';
import './code-output.css';
import './code-output-additions.css';
import './missing-output-styles.css';
import './output-button-fixes.css';
import './execution-status-styles.css';
import './advanced-execution-mode.css';
import './spinner-animation.css';
import './dark-theme-output.css';
import './output-panel-toggle.css';
import './improved-button-styles.css';
import './status-indicators.css';

// Styles for the dark theme output panel
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    position: 'relative',
    marginTop: '10px',
  },
  buttonBar: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 3px 6px rgba(37, 99, 235, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    letterSpacing: '0.3px',
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '36px',
  },
  primaryButton: {
    padding: '6px 15px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(145deg, #10b981, #059669)',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 3px 6px rgba(5, 150, 105, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    letterSpacing: '0.3px',
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    height: '36px',
  },
  disabledButton: {
    background: 'linear-gradient(145deg, #9ca3af, #6b7280)',
    cursor: 'not-allowed',
    opacity: 0.7,
    boxShadow: 'none',
  },
  panel: {
    padding: '18px',
    borderRadius: '10px',
    backgroundColor: '#1e293b', // Dark slate blue
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    border: '1px solid #334155',
    color: '#f8fafc',
    transition: 'all 0.3s ease',
    opacity: 1,
    maxHeight: '500px',
    overflow: 'auto',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  },
  inputPanel: {
    padding: '15px',
    borderRadius: '8px',
    backgroundColor: '#1e293b', // Dark slate blue
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #334155',
    marginTop: '10px',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #475569',
    padding: '10px',
    borderRadius: '4px',
    fontFamily: 'Consolas, monospace',
    minHeight: '150px',
    resize: 'vertical',
  },
  outputHeader: {
    color: '#a3b3cc',
    marginBottom: '10px',
    fontSize: '15px',
    fontWeight: '700',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  outputContent: {
    fontFamily: 'Consolas, monospace',
    fontSize: '15px',
    padding: '14px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: '6px',
    border: '1px solid #334155',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    minHeight: '50px',
    maxHeight: '300px',
  },
  errorContent: {
    fontFamily: 'Consolas, monospace',
    fontSize: '15px',
    padding: '14px',
    backgroundColor: '#350c0c',
    color: '#fecaca',
    borderRadius: '6px',
    border: '1px solid #713131',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    minHeight: '50px',
    maxHeight: '300px',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  statusBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '18px',
    borderTop: '1px solid #334155',
    marginTop: '15px',
    paddingTop: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: '0 0 6px 6px',
    padding: '12px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid rgba(51, 65, 85, 0.5)',
  },
  statusLabel: {
    color: '#a3b3cc',
    fontWeight: '600',
    letterSpacing: '0.3px',
  },
  statusValue: {
    color: '#e2e8f0',
    fontWeight: '700',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },
  statusSuccess: {
    color: '#34d399', // Green
    textShadow: '0 0 8px rgba(52, 211, 153, 0.3)',
  },
  statusError: {
    color: '#f87171', // Red
    textShadow: '0 0 8px rgba(248, 113, 113, 0.3)',
  },
  loadingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
  },
};

const CodeOutput = ({ code, language, theme }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [executionStats, setExecutionStats] = useState(null);
  const [stdin, setStdin] = useState('');
  const [lastExecuted, setLastExecuted] = useState(null);
  const [showInput, setShowInput] = useState(false);
  
  // Toggle input visibility
  const toggleInput = useCallback(() => {
    setShowInput(prev => !prev);
  }, []);

  // Execute code when user clicks run button
  const handleExecuteCode = async () => {
    if (isExecuting) return;
    
    // Allow empty code but show a message
    if (!code || !code.trim()) {
      setOutput('');
      setError('Please write some code before executing.');
      setExecutionStats({
        time: 0,
        memory: 0,
        exitCode: 0,
        status: { id: 3, description: 'No Code' }
      });
      return;
    }
    
    try {
      setIsExecuting(true);
      setError('');
      setOutput('');
      setExecutionStats(null);
      setLastExecuted(new Date());
      
      // Use the execution service
      const result = await executeCode(code, language, stdin);
      
      // Check if result is properly structured
      if (result && typeof result === 'object') {
        // Update UI with results
        setOutput(result.output || '');
        setError(result.error || '');
        setExecutionStats({
          time: result.executionTime || result.time || 0,
          memory: result.memory || 0,
          exitCode: typeof result.exitCode === 'number' ? result.exitCode : 0,
          status: result.status || { id: 3, description: 'Completed' },
        });
      } else {
        // Handle malformed result
        setOutput('Code execution completed, but returned in an unexpected format.');
        setExecutionStats({
          time: 0,
          memory: 0,
          exitCode: 0,
          status: { id: 3, description: 'Completed' }
        });
      }
    } catch (err) {
      console.error("Failed to execute code:", err);
      setError('Code execution system encountered an error.');
      setExecutionStats({
        time: 0,
        memory: 0,
        exitCode: 1,
        status: { id: 4, description: 'Error' }
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div style={styles.container} className={`code-output-container output-panel ${theme}`}>
      <div style={{
        ...styles.buttonBar,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#1e293b',
        padding: '8px',
        borderBottom: '1px solid #334155',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        flexDirection: 'column'
      }}>
        {/* Title row - only contains Output Panel text */}
        <div style={{ 
          display: 'flex', 
          width: '100%',
          justifyContent: 'flex-start',
          marginBottom: '8px'
        }}>
          <span style={{
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '4px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zM6 16h2v-2H6v2zm0-4h8v-2H6v2zm10 4h2v-2h-2v2zm-6 0h4v-2h-4v2z"/>
            </svg>
            Output Panel
          </span>
        </div>
        
        {/* Buttons row - contains both buttons with equal spacing */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px',
          width: '100%'
        }}>
          <button 
            className="toggle-input-btn"
            style={{
              ...styles.toggleButton,
              background: showInput ? 'linear-gradient(145deg, #3b82f6, #2563eb)' : 'linear-gradient(145deg, #1e40af, #1d4ed8)',
              flex: 1
            }}
            onClick={toggleInput}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {showInput ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  <path d="M3 12l-3-3v2h2v2H0v2l3-3zm18 0l3-3v2h-2v2h2v2l-3-3z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              )}
              <span>{showInput ? 'Hide Input' : 'Show Input'}</span>
            </div>
          </button>
          
          <button 
            className="run-code-btn"
            style={{
              ...styles.primaryButton,
              ...(isExecuting || !code.trim() ? styles.disabledButton : {}),
              flex: 1
            }}
            onClick={handleExecuteCode}
            disabled={isExecuting || !code.trim()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {isExecuting ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px', animation: 'spin 2s linear infinite' }}>
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
              <span>{isExecuting ? 'Executing...' : 'Run Code'}</span>
            </div>
          </button>
        </div>
      </div>

      {showInput && (
        <div style={styles.inputPanel}>
          <div style={styles.outputHeader}>
            <span>Program Input</span>
          </div>
          <textarea
            style={styles.textarea}
            placeholder="Enter input for your program here..."
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            disabled={isExecuting}
          />
        </div>
      )}

      <div style={styles.panel}>
        {isExecuting && (
          <div style={styles.loadingIndicator}>
            <div className="loading-spinner"></div>
            <span>Executing {language} code...</span>
          </div>
        )}
        
        {!isExecuting && (
          <>
            {output && (
              <div>
                <div style={styles.outputHeader}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
                      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
                    </svg>
                    Output
                  </span>
                </div>
                <pre className="output-content" style={styles.outputContent}>{output}</pre>
              </div>
            )}
            
            {error && (
              <div style={{ marginTop: output ? '15px' : 0 }}>
                <div style={styles.outputHeader}>
                  <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
                      <path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2zm0 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm-1 13v-2h2v2h-2zm0-4V7h2v6h-2z"/>
                    </svg>
                    Error
                  </span>
                </div>
                <pre className="output-content" style={styles.errorContent}>{error}</pre>
              </div>
            )}
            
            {executionStats && (
              <div style={styles.statusBar}>
                <div className="status-item" style={{...styles.statusItem, '--index': 0}}>
                  <span style={styles.statusLabel}>
                    <span className={`status-badge ${executionStats.status?.id === 3 ? 'success' : 'error'}`}>
                      {executionStats.status?.id === 3 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                        </svg>
                      )}
                    </span>
                    Status:
                  </span>
                  <span style={{
                    ...styles.statusValue,
                    ...(executionStats.status?.id === 3 ? styles.statusSuccess : styles.statusError)
                  }}>
                    {executionStats.status?.description || 'Unknown'}
                  </span>
                </div>
                
                {executionStats.time !== undefined && (
                  <div className="status-item" style={{...styles.statusItem, '--index': 1}}>
                    <span style={styles.statusLabel}>
                      <span className="status-badge info">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                        </svg>
                      </span>
                      Time:
                    </span>
                    <span style={styles.statusValue}>{executionStats.time}s</span>
                  </div>
                )}
                
                {executionStats.memory !== undefined && (
                  <div className="status-item" style={{...styles.statusItem, '--index': 2}}>
                    <span style={styles.statusLabel}>
                      <span className="status-badge info">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                          <path d="M2 9h2v6H2V9zm3 0h1v6H5V9zm2 0h1v6H7V9zm2 0h2v6H9V9zm3 0h1v6h-1V9zm2 0h1v6h-1V9zm2 0h1v6h-1V9zm2 0h2v6h-2V9zM4 5h16v2H4V5zm0 12h16v2H4v-2z"/>
                        </svg>
                      </span>
                      Memory:
                    </span>
                    <span style={styles.statusValue}>{Math.round(executionStats.memory / 1024)} KB</span>
                  </div>
                )}
                
                <div className="status-item" style={{...styles.statusItem, '--index': 3}}>
                  <span style={styles.statusLabel}>
                    <span className="status-badge info">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                      </svg>
                    </span>
                    Exit Code:
                  </span>
                  <span style={styles.statusValue}>{executionStats.exitCode}</span>
                </div>
              </div>
            )}
            
            {lastExecuted && !output && !error && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                <p>Program executed successfully, but produced no output.</p>
              </div>
            )}
            
            {!lastExecuted && !isExecuting && (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: '15px',
                  backgroundColor: '#1a2234',
                  borderRadius: '6px',
                  padding: '20px',
                  border: '1px dashed #334155'
                }}>
                  <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '5px' }}>
                    Ready to execute your {language || 'code'}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '400px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      color: '#64748b',
                      fontSize: '14px'
                    }}>
                      <span>✓</span>
                      <span>Output will be displayed here</span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      color: '#64748b',
                      fontSize: '14px'
                    }}>
                      <span>✓</span>
                      <span>Execution statistics will be shown</span>
                    </div>
                    
                    {language && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        color: '#64748b',
                        fontSize: '14px'
                      }}>
                        <span>✓</span>
                        <span>Code will run with {language} compiler/interpreter</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    style={{
                      ...styles.primaryButton,
                      marginTop: '10px',
                      padding: '10px 25px',
                      ...(code?.trim() ? {} : styles.disabledButton)
                    }}
                    onClick={handleExecuteCode}
                    disabled={!code?.trim()}
                  >
                    Run Code
                  </button>
                  
                  <p style={{ color: '#64748b', fontSize: '12px', marginTop: '10px' }}>
                    Output will always be displayed in this panel
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CodeOutput;
