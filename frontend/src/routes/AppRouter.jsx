import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import HomePage from '../pages/HomePage';
import EditorPage from '../pages/EditorPage';
import AboutPage from '../pages/AboutPage';
import NotFoundPage from '../pages/NotFoundPage';
import UserProfilePage from '../pages/UserProfilePage';
import ProjectListPage from '../pages/ProjectListPage';

// Auth Components
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import ForgotPassword from '../components/auth/ForgotPassword';
import ResetPassword from '../components/auth/ResetPassword';
import PrivateRoute from '../components/auth/PrivateRoute';

// AI Chatbot
import AiChatbot from '../components/common/AiChatbot';

// Auth Context
import { useAuth } from '../context/AuthContext';

const AppRouter = () => {
  // Shared state between routes that should persist
  const [theme, setTheme] = React.useState(
    () => {
      const savedTheme = window.localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  );
  
  React.useEffect(() => {
    const isDark = theme === 'dark';
    const root = document.documentElement;
    const body = document.body;

    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    body.classList.toggle('dark', isDark);
    body.classList.toggle('light', !isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';

    window.localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Get authentication state from context
  const { isAuthenticated } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage theme={theme} setTheme={setTheme} isAuthenticated={isAuthenticated} />} />
        <Route path="/about" element={<AboutPage theme={theme} setTheme={setTheme} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/editor" element={<EditorPage theme={theme} setTheme={setTheme} />} />
          <Route path="/editor/:projectId" element={<EditorPage theme={theme} setTheme={setTheme} />} />
          <Route path="/profile" element={<UserProfilePage theme={theme} setTheme={setTheme} />} />
          <Route path="/projects" element={<ProjectListPage theme={theme} setTheme={setTheme} />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* AI Chatbot available on all pages for authenticated users */}
      {isAuthenticated && <AiChatbot />}
    </BrowserRouter>
  );
};

export default AppRouter;
