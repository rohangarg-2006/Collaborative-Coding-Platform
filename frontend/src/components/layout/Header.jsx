import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ 
  theme = "light", 
  setTheme = () => {}, 
  language, 
  setLanguage, 
  showErrors, 
  setShowErrors, 
  sidebarOpen, 
  setSidebarOpen,
  languages = []
}) => {  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get first letter of user's name for avatar
  const getInitial = () => {
    if (currentUser && currentUser.firstName) {
      return currentUser.firstName.charAt(0).toUpperCase();
    } else if (currentUser && currentUser.username) {
      return currentUser.username.charAt(0).toUpperCase();
    }
    return '?';
  };  return (
    <header className="flex items-center justify-between px-6 py-3 navbar-gradient text-white shadow-xl backdrop-blur-sm z-10 sticky top-0 relative">
      <div className="flex items-center gap-2">        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-purple-200 tracking-tight group-hover:scale-105 transition-transform duration-300 text-glow">CodeCollab</span>
          <div className="relative">
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs text-white font-bold shadow-md">Live</span>
            <span className="absolute -inset-1 rounded-full bg-white/20 animate-ping opacity-75"></span>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        {setSidebarOpen && (
          <button 
            className="md:hidden p-2 rounded-full bg-indigo-700/50 text-white hover:bg-indigo-600 transition-all duration-300 shadow-md hover:shadow-indigo-500/50" 
            onClick={() => setSidebarOpen(o => !o)} 
            title="Toggle Sidebar"
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        )}          {isAuthenticated && (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-medium text-indigo-100 mr-1 bg-indigo-700/30 px-3 py-1 rounded-full">
                {currentUser?.firstName ? `Hi, ${currentUser.firstName}` : ''}
              </span>              <Link 
                to="/profile" 
                className="group px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-emerald-500/50 flex items-center gap-1.5 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="group-hover:translate-x-0.5 transition-transform duration-300">Profile</span>
              </Link>
              <Link 
                to="/projects" 
                className="group px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-amber-500/50 flex items-center gap-1.5 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                <span className="group-hover:translate-x-0.5 transition-transform duration-300">Projects</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="group px-4 py-1.5 rounded-full bg-red-600/40 hover:bg-red-500/60 transition-all duration-300 shadow-md hover:shadow-red-500/50 flex items-center gap-1.5 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm7 5a1 1 0 00-1 1v4a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  <path d="M12.293 7.293a1 1 0 011.414 0L15 8.586V7a1 1 0 00-1-1h-1.586l-.121.121z" />
                </svg>
                <span className="group-hover:translate-x-0.5 transition-transform duration-300">Logout</span>
              </button>
            </div>            <div className="md:hidden flex items-center gap-2">
              <Link 
                to="/profile" 
                className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-emerald-500/50"
                aria-label="Profile"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link 
                to="/projects" 
                className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-amber-500/50"
                aria-label="Projects"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full bg-red-600/40 hover:bg-red-500/60 transition-all duration-300 shadow-md hover:shadow-red-500/50"
                aria-label="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm7 5a1 1 0 00-1 1v4a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  <path d="M12.293 7.293a1 1 0 011.414 0L15 8.586V7a1 1 0 00-1-1h-1.586l-.121.121z" />
                </svg>
              </button>
            </div>
          </div>        )}        {language !== undefined && setLanguage && languages && languages.length > 0 && (
          <div className="relative group">
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <select
                className="rounded-full px-3 py-1.5 bg-indigo-700/40 hover:bg-indigo-600/60 text-white font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 shadow-md cursor-pointer appearance-none pr-8 text-sm"
                value={language}
                onChange={(e) => {
                  const newLanguage = e.target.value;
                  setLanguage(newLanguage);
                  
                  // Show tooltip when language changes
                  const tooltip = document.getElementById('language-change-tooltip');
                  if (tooltip) {
                    tooltip.textContent = `Changed to ${languages.find(l => l.value === newLanguage)?.label || newLanguage}`;
                    tooltip.classList.remove('opacity-0');
                    tooltip.classList.add('opacity-100');
                    setTimeout(() => {
                      tooltip.classList.remove('opacity-100');
                      tooltip.classList.add('opacity-0');
                    }, 2000);
                  }
                  
                  // After the language has changed, force a validation to ensure errors appear
                  // in all language types, not just JavaScript/TypeScript
                  setTimeout(() => {
                    try {
                    const editorInstance = document.querySelector('.monaco-editor')?.editorInstance;
                    if (editorInstance && window.monaco) {
                      // Try to get model
                      const model = editorInstance.getModel();
                      if (model) {
                        // Trigger a small edit to force validation
                        const lastLine = model.getLineCount();
                        const lastCol = model.getLineMaxColumn(lastLine);
                        model.pushEditOperations([], 
                          [{ 
                            range: new window.monaco.Range(lastLine, lastCol, lastLine, lastCol), 
                            text: ' ' 
                          }], 
                          () => null);
                        
                        // Immediately undo it
                        setTimeout(() => {
                          model.pushEditOperations([], 
                            [{ 
                              range: new window.monaco.Range(lastLine, lastCol+1, lastLine, lastCol+1), 
                              text: '' 
                            }], 
                            () => null);
                        }, 10);
                      }
                    }
                  } catch (e) {
                    console.warn('Error triggering validation after language change:', e);
                  }
                }, 300);
                }}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                {Array.isArray(languages) && languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div id="language-change-tooltip" className="absolute -bottom-9 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs py-1 px-3 rounded-full opacity-0 transition-opacity duration-300 text-center font-medium shadow-md">
              Changed language
            </div>
          </div>
        )}
        
        {setShowErrors && showErrors !== undefined && (
          <button
            className="group px-3 py-1.5 rounded-full bg-indigo-600/40 hover:bg-indigo-500/60 transition-all duration-300 shadow-md hover:shadow-indigo-500/50 flex items-center gap-1.5 text-sm"
            onClick={() => setShowErrors(e => !e)}
            title="Toggle Interview Mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">
              {showErrors ? "Mode: Normal" : "Mode: Interview"}
            </span>
          </button>
        )}
        
        <button
          className="p-2 rounded-full bg-indigo-600/40 hover:bg-indigo-500/60 transition-all duration-300 shadow-md hover:shadow-indigo-500/50 flex items-center justify-center"
          onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
          title="Toggle Dark/Light Mode"
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>        {!isAuthenticated && (
          <Link to="/login" className="group px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all duration-300 hover:shadow-indigo-500/50 flex items-center gap-1.5 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
