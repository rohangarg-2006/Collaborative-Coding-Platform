import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  // Handle authentication timeout
  useEffect(() => {
    const authCheckTimeout = setTimeout(() => {
      if (loading) {
        // If still loading after 5 seconds, redirect to login
        console.log("Authentication check timeout - redirecting to login");
        navigate('/login');
      }
    }, 5000);
    
    return () => clearTimeout(authCheckTimeout);
  }, [loading, navigate]);
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300">Loading your profile...</p>
      </div>
    );
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
