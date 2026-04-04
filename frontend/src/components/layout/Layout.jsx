import React from 'react';
import Header from './Header';
import AboutHeader from './AboutHeader';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';

const Layout = ({ 
  children, 
  theme, 
  setTheme, 
  language, 
  setLanguage, 
  showErrors, 
  setShowErrors,
  languages, 
  sidebarOpen, 
  setSidebarOpen 
}) => {  // Get the current location to determine which header to use
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const isProfilePage = location.pathname === '/profile';
  return (
    <div className={`
      min-h-screen w-screen page-background
      ${isAboutPage 
        ? 'bg-white dark:bg-gray-800' 
        : 'bg-gradient-to-b from-indigo-800/10 via-indigo-100/20 to-purple-100/20 dark:from-indigo-900 dark:via-gray-800 dark:to-purple-900/20'
      }
      transition-colors duration-300 flex flex-col
      ${isAboutPage ? 'justify-between' : ''}
    `}>
      {isAboutPage ? (
        <AboutHeader 
          theme={theme} 
          setTheme={setTheme} 
        />
      ) : (
        <Header 
          theme={theme} 
          setTheme={setTheme} 
          language={language} 
          setLanguage={setLanguage}
          showErrors={showErrors} 
          setShowErrors={setShowErrors}
          languages={languages}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}      <main className={`
        flex-1 flex flex-row w-full 
        ${isAboutPage ? 'h-auto' : 'h-full'}
        mb-2
      `}>
        {!isAboutPage && sidebarOpen !== undefined && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
        {children}      </main>
      <Footer />
    </div>
  );
};

export default Layout;
