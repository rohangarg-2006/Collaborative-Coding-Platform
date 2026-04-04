import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const isProfilePage = location.pathname === '/profile';
  const isEditorPage = location.pathname.includes('/editor');
    return (
    <footer className={`
      text-center py-4 z-10 w-full mt-auto sticky-footer theme-footer
      shadow-inner 
      ${isProfilePage ? 'mt-12' : ''}
      ${isAboutPage ? 'theme-footer-about' : ''}
    `}>
      <div className="container mx-auto">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-indigo-700 dark:text-indigo-300">CodeCollab</span> &mdash; Collaborative Coding Platform
      </div>
    </footer>
  );
};

export default Footer;
