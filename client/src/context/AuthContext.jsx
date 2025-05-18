import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../utils/authService';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update auth state based on local storage
  const refreshAuthState = () => {
    const user = AuthService.getStoredUser();
    const token = AuthService.getToken();
    
    setCurrentUser(user);
    setIsAuthenticated(!!token && !!user);
    setLoading(false);
  };

  // Load user on initial render
  useEffect(() => {
    refreshAuthState();
    
    // Listen for storage events (login/logout in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        refreshAuthState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const data = await AuthService.login(email, password);
      refreshAuthState();
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const data = await AuthService.register(userData);
      refreshAuthState();
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AuthService.logout();
      refreshAuthState();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
    // Forgot Password function
  const forgotPassword = async (email) => {
    try {
      await AuthService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  // Validate Reset Token
  const validateResetToken = async (token) => {
    try {
      await AuthService.validateResetToken(token);
    } catch (error) {
      throw error;
    }
  };

  // Reset Password function
  const resetPassword = async (token, password) => {
    try {
      await AuthService.resetPassword(token, password);
    } catch (error) {
      throw error;
    }
  };

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    validateResetToken,
    resetPassword,
    refreshAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Allow rendering children even when loading to avoid white screen */}
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
