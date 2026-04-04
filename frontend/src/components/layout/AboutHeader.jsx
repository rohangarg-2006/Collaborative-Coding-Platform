import React from 'react';
import { Link } from 'react-router-dom';

const AboutHeader = ({ theme, setTheme }) => {  return (
    <header className="flex items-center justify-between px-6 py-3 navbar-gradient text-white shadow-xl backdrop-blur-sm z-10 sticky top-0 relative">
      <div className="flex items-center gap-2">        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-purple-200 tracking-tight group-hover:scale-105 transition-transform duration-300 text-glow">CodeCollab</span>
          <div className="relative">
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-xs text-white font-bold shadow-md">About</span>
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="group px-4 py-1.5 rounded-full bg-indigo-600/40 hover:bg-indigo-500/60 transition-all duration-300 shadow-md hover:shadow-indigo-500/50 flex items-center gap-1.5 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span className="group-hover:-translate-x-0.5 transition-transform duration-300">Back to Home</span>
        </Link>
        
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
        </button>
      </div>
    </header>
  );
};

export default AboutHeader;
