import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const isProfilePage = location.pathname === '/profile';
  const isEditorPage = location.pathname.includes('/editor');
    return (
    <footer className={`
      text-center py-4 z-10 w-full mt-auto sticky-footer
      ${isAboutPage ? 'text-gray-200 bg-gray-900 border-t border-gray-600' : 'text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700'} 
      shadow-inner 
      ${isProfilePage ? 'mt-12' : ''}
    `}>
      <div className="container mx-auto">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-indigo-700 dark:text-indigo-300">CodeCollab</span> &mdash; Collaborative Coding Platform
      </div>
    </footer>
  );
};

export default Footer;
