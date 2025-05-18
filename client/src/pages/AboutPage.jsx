import React from 'react';
import Layout from '../components/layout/Layout';
import { LANGUAGES } from '../utils/constants';
import { Link } from 'react-router-dom';

const AboutPage = ({ theme, setTheme }) => {
  // We don't need sidebar in the About page
  const sidebarOpen = false;
  const setSidebarOpen = () => {}; // Empty function since we don't need it
  
  // These states are required by Layout but not used in About page
  const [language, setLanguage] = React.useState("javascript");
  const [showErrors, setShowErrors] = React.useState(true);

  return (
    <Layout 
      theme={theme} 
      setTheme={setTheme} 
      language={language} 
      setLanguage={setLanguage}
      showErrors={showErrors} 
      setShowErrors={setShowErrors}
      languages={LANGUAGES}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >      
      <div className="flex-1 flex flex-col p-8 overflow-auto mb-6 bg-gradient-to-br from-white via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 min-h-screen transition-colors duration-700">
        <div className="max-w-3xl mx-auto bg-white/95 dark:bg-gray-900/95 rounded-3xl p-10 shadow-2xl mb-10 border border-indigo-100 dark:border-indigo-800 transition-all duration-700 animate-fadeIn opacity-0 animate-fadeIn-active">
          <h1 className="text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 dark:from-indigo-200 dark:via-purple-300 dark:to-pink-300 mb-10 drop-shadow-xl tracking-tight transition-all duration-700 animate-fadeIn opacity-0 animate-fadeIn-active">
            About CodeCollab
          </h1>
          <div className="prose dark:prose-invert max-w-none text-lg">
            <p className="text-gray-700 dark:text-gray-200 mb-8 leading-relaxed text-xl text-center transition-colors duration-700 animate-fadeIn opacity-0 animate-fadeIn-active">
              CodeCollab is a collaborative coding platform for teams, learners, and interviewers. Write, share, and edit code together in real-time, with a beautiful and accessible interface.
            </p>
            <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-300 mt-10 mb-8 border-b-2 border-indigo-100 dark:border-indigo-700 pb-2 transition-all duration-700 animate-fadeIn opacity-0 animate-fadeIn-active">Key Features</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 list-none p-0">
              <li className="flex items-center gap-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold shadow-lg transition-all duration-500">💡</span>
                <span className="font-semibold text-indigo-900 dark:text-indigo-100">Real-time Collaboration</span>
              </li>
              <li className="flex items-center gap-4 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-xl p-5 border border-amber-200 dark:border-amber-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: '0.15s' }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl font-bold shadow-lg transition-all duration-500">🌐</span>
                <span className="font-semibold text-orange-900 dark:text-orange-100">Multi-language Support</span>
              </li>
              <li className="flex items-center gap-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 rounded-xl p-5 border border-blue-200 dark:border-blue-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: '0.3s' }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-white text-2xl font-bold shadow-lg transition-all duration-500">⬇️</span>
                <span className="font-semibold text-blue-900 dark:text-blue-100">Downloadable Codes</span>
              </li>
              <li className="flex items-center gap-4 bg-gradient-to-br from-pink-100 to-fuchsia-100 dark:from-pink-900 dark:to-fuchsia-900 rounded-xl p-5 border border-pink-200 dark:border-pink-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: '0.45s' }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white text-2xl font-bold shadow-lg transition-all duration-500">🤖</span>
                <span className="font-semibold text-pink-900 dark:text-pink-100">AI Chatbot</span>
              </li>
              <li className="flex items-center gap-4 bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900 dark:to-lime-900 rounded-xl p-5 border border-green-200 dark:border-green-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: '0.6s' }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-lime-500 text-white text-2xl font-bold shadow-lg transition-all duration-500">🖥️</span>
                <span className="font-semibold text-green-900 dark:text-green-100">Output of the Codes</span>
              </li>
              <li className="flex items-center gap-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: '0.75s' }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold shadow-lg transition-all duration-500">🎯</span>
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">Interview Mode</span>
              </li>
              <li className="flex items-center gap-4 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: '0.9s' }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 text-white text-2xl font-bold shadow-lg transition-all duration-500">🌙</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Light & Dark Themes</span>
              </li>
              <li className="flex items-center gap-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-xl p-5 border border-purple-200 dark:border-purple-800 shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: '1.05s' }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-700 text-white text-2xl font-bold shadow-lg transition-all duration-500">📱</span>
                <span className="font-semibold text-purple-900 dark:text-purple-100">Responsive Design</span>
              </li>
            </ul>
            <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-300 mt-12 mb-6 border-b-2 border-indigo-100 dark:border-indigo-700 pb-2 transition-all duration-700 animate-fadeIn opacity-0 animate-fadeIn-active">Supported Languages</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {LANGUAGES.map((lang, idx) => (
                <div key={lang.value} className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-800 rounded-lg p-3 text-center text-white font-semibold shadow-md border border-indigo-700 dark:border-indigo-500 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fadeIn opacity-0 animate-fadeIn-active" style={{ animationDelay: `${0.2 + idx * 0.05}s` }}>
                  {lang.label}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Link
                to="/"
                className="inline-flex items-center px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-700 text-white rounded-xl hover:bg-indigo-800 dark:hover:bg-indigo-800 transition shadow-lg border border-indigo-600 dark:border-indigo-500 font-semibold text-lg gap-2 duration-500 animate-fadeIn opacity-0 animate-fadeIn-active"
                style={{ animationDelay: '1.2s' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                </svg>
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;

/* Add this to your index.css or a global CSS file:
.animate-fadeIn {
  animation: fadeInUp 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
.animate-fadeIn-active {
  opacity: 1 !important;
}
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
*/
