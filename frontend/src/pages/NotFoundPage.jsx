import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-100 via-white to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <h1 className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-5 py-2.5 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
