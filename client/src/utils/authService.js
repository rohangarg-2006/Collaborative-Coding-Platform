import axios from 'axios';

// API base URL from environment variable or fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user data if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication service
const AuthService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  },
  
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Login failed';
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      await api.get('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch user';
    }
  },
  
  // Update user details
  updateUserDetails: async (userData) => {
    try {
      const response = await api.put('/auth/updatedetails', userData);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.data));
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update profile';
    }
  },
  
  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/updatepassword', {
        currentPassword,
        newPassword
      });
      
      // Update token if returned
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update password';
    }
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    return Boolean(localStorage.getItem('token'));
  },
  
  // Get stored user data
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Get auth token
  getToken: () => {
    return localStorage.getItem('token');
  },
    // Delete user account
  deleteAccount: async (password) => {
    try {
      const response = await api.post('/auth/delete', { password });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete account';
    }
  },
  
  // Request password reset email
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to send reset email';
    }
  },
  
  // Validate reset token
  validateResetToken: async (token) => {
    try {
      const response = await api.get(`/auth/resetpassword/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Invalid or expired token';
    }
  },
  
  // Reset password with token
  resetPassword: async (token, password) => {
    try {
      const response = await api.put(`/auth/resetpassword/${token}`, { password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to reset password';
    }
  }
};

export default AuthService;
