import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LANGUAGES } from '../utils/constants';
import AuthService from '../utils/authService';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';

const HomePage = ({ theme, setTheme, isAuthenticated }) => {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const dropdownRef = useRef(null); // Separate ref for dropdown
  const { currentUser } = useAuth();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get first letter of user's name for avatar
  const getInitial = () => {
    if (currentUser && currentUser.firstName) {
      return currentUser.firstName.charAt(0).toUpperCase();
    } else if (currentUser && currentUser.username) {
      return currentUser.username.charAt(0).toUpperCase();
    }
    return '?';
  };
  
  const handleLogout = async () => {
    await AuthService.logout();
    window.location.reload();
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-800/10 via-indigo-100/20 to-purple-100/20 dark:from-indigo-900 dark:via-gray-800 dark:to-purple-900/20 transition-colors homepage-root page-background">
      {/* Hero Section */}
      <header className="px-6 py-3 navbar-gradient text-white shadow-xl backdrop-blur-sm z-10 sticky top-0 relative">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-purple-200 tracking-tight group-hover:scale-105 transition-transform duration-300 text-glow">CodeCollab</span>
            <div className="relative">
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs text-white font-bold shadow-md">Live</span>
              <span className="absolute -inset-1 rounded-full bg-white/20 animate-ping opacity-75"></span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-white hover:text-indigo-200 font-medium">About</Link>
            {isAuthenticated ? (
              <>
                <Link to="/editor" className="group px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all duration-300 shadow-md hover:shadow-emerald-500/50 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">Launch Editor</span>
                </Link>
                <div className="relative" ref={menuButtonRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white flex items-center justify-center font-bold shadow-md hover:shadow-violet-500/30 transition-all duration-300 border-2 border-purple-300/30"
                    title={currentUser?.username || 'User Menu'}
                    tabIndex={0}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                  >
                    {getInitial()}
                  </button>
                </div>
                {userMenuOpen && createPortal(
                  <div ref={dropdownRef} className="homepage-user-dropdown fixed right-6 top-16 w-48 bg-white dark:bg-gray-800 rounded-md shadow-2xl z-[99999] pointer-events-auto border border-gray-200 dark:border-gray-700">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-bold">{currentUser?.username || 'User'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email || ''}</div>
                      </div>
                      <Link
                        to="/profile"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 flex items-center"
                        onClick={() => setUserMenuOpen(false)}
                        tabIndex={0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        to="/projects"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 flex items-center"
                        onClick={() => setUserMenuOpen(false)}
                        tabIndex={0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        My Projects
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center"
                        tabIndex={0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-indigo-200 transition-all duration-200 font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300 shadow-md hover:shadow-amber-500/50 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register
                </Link>
              </>
            )}
            <button
              className="ml-2 p-2 rounded-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-purple-500/30 transition-all duration-300 border-2 border-purple-300/30"
              onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
              title="Toggle Dark/Light Mode"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/editor" className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all duration-300 shadow-md hover:shadow-emerald-500/50 flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Editor
                </Link>
                <div className="relative ml-2" ref={menuButtonRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white flex items-center justify-center font-bold shadow-md hover:shadow-violet-500/30 transition-all duration-300 border border-purple-300/30 text-xs"
                    title={currentUser?.username || 'User Menu'}
                    tabIndex={0}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                  >
                    {getInitial()}
                  </button>
                </div>
                {userMenuOpen && createPortal(
                  <div ref={dropdownRef} className="homepage-user-dropdown fixed right-6 top-16 w-48 bg-white dark:bg-gray-800 rounded-md shadow-2xl z-[99999] pointer-events-auto border border-gray-200 dark:border-gray-700">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-bold">{currentUser?.username || 'User'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email || ''}</div>
                      </div>
                      <Link
                        to="/profile"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 flex items-center"
                        onClick={() => setUserMenuOpen(false)}
                        tabIndex={0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        to="/projects"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 flex items-center"
                        onClick={() => setUserMenuOpen(false)}
                        tabIndex={0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        My Projects
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center"
                        tabIndex={0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-300 shadow-md text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
                <Link to="/register" className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300 shadow-md hover:shadow-amber-500/50 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register
                </Link>
              </>
            )}
            <button
              className="ml-1 p-1.5 rounded-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-purple-500/30 transition-all duration-300 border border-purple-300/30 text-sm"
              onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
              title="Toggle Dark/Light Mode"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-400">Collaborative Coding</span> 
              <span className="text-indigo-700 dark:text-gray-100">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-10">
              Real-time collaboration in multiple programming languages. Share, code, and create together from anywhere.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
              {isAuthenticated ? (
                <Link to="/editor" className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 max-w-xs mx-auto md:mx-0">
                  <span>Start Coding Now</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              ) : (
                <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-2 max-w-xs mx-auto md:mx-0">
                  <span>Create Account</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              )}
              <Link to="/about" className="px-8 py-4 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-indigo-200 dark:border-indigo-500/30 hover:bg-white dark:hover:bg-gray-600 text-indigo-700 dark:text-indigo-200 font-medium text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-indigo-200/30 dark:hover:shadow-indigo-500/20 max-w-xs mx-auto md:mx-0 flex items-center justify-center">
                <span>Learn More</span>
              </Link>
            </div>
            <div className="relative mx-auto max-w-5xl rounded-xl shadow-2xl border border-indigo-300/30 dark:border-indigo-700/30 overflow-hidden backdrop-blur-sm bg-white/60 dark:bg-gray-900/60">
              <div className="bg-gradient-to-r from-indigo-800 to-purple-800 dark:from-indigo-900 dark:to-purple-900 h-12 flex items-center px-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="mx-auto text-white opacity-90 text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  CodeCollab Editor
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-600/60 text-white text-xs">Live</span>
                </div>
              </div>
              <div className="bg-gray-900 px-4 py-8 font-mono text-green-300 dark:text-green-400 text-sm md:text-base overflow-hidden">
                <pre className="overflow-hidden">
                  <code className="flex flex-col gap-1">
                    <span className="text-indigo-400">// Welcome to CodeCollab</span>
                    <span className="text-purple-400">function <span className="text-yellow-300">greeting</span>() {'{'}</span>
                    <span className="pl-4">console.<span className="text-blue-400">log</span>(<span className="text-green-300">"Hello, world!"</span>);</span>
                    <span className="pl-4">console.<span className="text-blue-400">log</span>(<span className="text-green-300">"Start coding together in real-time!"</span>);</span>
                    <span className="text-purple-400">{'}'}</span>
                    <span></span>
                    <span className="text-yellow-300">greeting</span>();
                    <span></span>
                    <span className="text-indigo-400">// Features:</span>
                    <span className="text-indigo-400">// - Collaborative editing</span>
                    <span className="text-indigo-400">// - {LANGUAGES.length} programming languages</span>
                    <span className="text-indigo-400">// - Syntax highlighting</span>
                    <span className="text-indigo-400">// - Error detection</span>
                    <span className="text-indigo-400">// - Light & dark themes</span>
                    <span className="text-indigo-400">// - Downloadable codes</span>
                    <span className="text-indigo-400">// - AI chatbot</span>
                    <span className="text-indigo-400">// - Output of the codes</span>
                  </code>
                </pre>
                <div className="absolute bottom-2 right-4 flex space-x-1.5 opacity-50">
                  <div className="w-1.5 h-5 bg-white/30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="py-16 bg-white/80 dark:bg-gray-900/50 border-t border-indigo-200/50 dark:border-indigo-700/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-400">Powerful Features</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg border border-indigo-200/40 dark:border-indigo-700/30 backdrop-blur-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-700/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-400">Real-time Collaboration</h3>
                <p className="text-gray-800 dark:text-gray-200">Code with your team in real-time, see changes as they happen, and work together more efficiently.</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg border border-indigo-200/40 dark:border-indigo-700/30 backdrop-blur-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-700/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-600 dark:to-orange-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-300 dark:to-orange-400">Multiple Languages</h3>
                <p className="text-gray-800 dark:text-gray-200">Support for JavaScript, Python, C++, Java, and many more programming languages.</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg border border-indigo-200/40 dark:border-indigo-700/30 backdrop-blur-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-700/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-600 dark:to-teal-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-300 dark:to-teal-400">Interview Mode</h3>
                <p className="text-gray-800 dark:text-gray-200">Toggle error highlighting on/off for technical interviews and coding challenges.</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg border border-indigo-200/40 dark:border-indigo-700/30 backdrop-blur-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-700/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4m-4 4V4m8 16H4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500">Downloadable Codes</h3>
                <p className="text-gray-800 dark:text-gray-200">Easily download your code files to your device for backup or sharing.</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg border border-indigo-200/40 dark:border-indigo-700/30 backdrop-blur-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-700/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-fuchsia-500 dark:from-pink-600 dark:to-fuchsia-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 15s1.5 2 4 2 4-2 4-2" />
                    <circle cx="9" cy="10" r="1" />
                    <circle cx="15" cy="10" r="1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-fuchsia-500 dark:from-pink-300 dark:to-fuchsia-400">AI Chatbot</h3>
                <p className="text-gray-800 dark:text-gray-200">Get instant coding help, explanations, and suggestions from the integrated AI chatbot.</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-lg shadow-lg border border-indigo-200/40 dark:border-indigo-700/30 backdrop-blur-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-700/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-lime-500 dark:from-green-600 dark:to-lime-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8M8 16h8M8 8h8" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-lime-500 dark:from-green-300 dark:to-lime-400">Output of the Codes</h3>
                <p className="text-gray-800 dark:text-gray-200">See the output of your code instantly within the editor for faster feedback and debugging.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-6 bg-white/80 dark:bg-gray-900/80 border-t border-indigo-200/40 dark:border-indigo-700/30 shadow-inner backdrop-blur-sm sticky-footer">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            &copy; {new Date().getFullYear()} <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-400">CodeCollab</span> &mdash; Collaborative Coding Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
