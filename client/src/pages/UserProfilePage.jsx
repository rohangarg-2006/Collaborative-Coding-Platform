import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../utils/authService';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const UserProfile = ({ theme = 'light', setTheme = () => {} }) => {
  const { currentUser, refreshAuthState } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        if (currentUser) {
          setUser(currentUser);
          setFormData({
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
            username: currentUser.username || '',
            email: currentUser.email || '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          });
          setLoading(false);
        } else {
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            username: userData.username || '',
            email: userData.email || '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load user profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [currentUser]);
  
  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (!formData.currentPassword) {
        setError('Current password is required to set a new password');
        return;
      }
    }
    
    try {
      setLoading(true);
      
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };
      
      await AuthService.updateUserDetails(updateData);
      
      if (formData.newPassword) {
        await AuthService.updatePassword(
          formData.currentPassword,
          formData.newPassword
        );
      }
      
      refreshAuthState();
      setEditMode(false);
      setSuccessMsg('Profile updated successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };
  
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!confirmPassword) {
      setError('Password is required to delete your account');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await AuthService.deleteAccount(confirmPassword);
      AuthService.logout();
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Failed to delete account. Please check your password and try again.');
      setLoading(false);
    }
  };
  
  if (loading && !user) {
    return (
      <Layout theme={theme} setTheme={setTheme}>
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-200">Loading profile...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout theme={theme} setTheme={setTheme}>
      <div className="user-profile-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #6c47ff 0%, #4b2997 100%)' }}>
        <div className="user-profile-card" style={{ maxWidth: 600, width: '100%', borderRadius: 32, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', background: 'linear-gradient(120deg, #4b2997 0%, #6c47ff 100%)', padding: '36px 28px 32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#f3f4fa' }}>
          <div className="user-profile-avatar" style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff', color: '#5f5fff', fontWeight: 700, fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 4px 24px 0 rgba(95,95,255,0.15)' }}>
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'A'}
          </div>
          <div className="user-profile-details" style={{ width: '100%' }}>
            <h1 className="profile-title" style={{ fontSize: 44, fontWeight: 400, textAlign: 'center', marginBottom: 20, color: '#e0e6ff', letterSpacing: 1 }}>User Profile</h1>
            <div className="profile-actions" style={{ margin: '0 0 28px 0', gap: '18px', display: 'flex', justifyContent: 'center' }}>
              <Link to="/" className="profile-action-btn" style={{ color: '#fff', background: '#5f5fff', fontWeight: 600, fontSize: 18, borderRadius: 8, padding: '8px 22px', boxShadow: '0 2px 8px 0 rgba(95,95,255,0.10)', transition: 'background 0.2s' }}>Home</Link>
              <Link to="/projects" className="profile-action-btn" style={{ color: '#fff', background: '#5f5fff', fontWeight: 600, fontSize: 18, borderRadius: 8, padding: '8px 22px', boxShadow: '0 2px 8px 0 rgba(95,95,255,0.10)', transition: 'background 0.2s' }}>My Projects</Link>
              <button onClick={handleLogout} className="profile-action-btn" style={{ color: '#fff', background: '#ff4d6d', fontWeight: 600, fontSize: 18, borderRadius: 8, padding: '8px 22px', boxShadow: '0 2px 8px 0 rgba(255,77,109,0.10)', transition: 'background 0.2s' }}>Logout</button>
            </div>
            {successMsg && (
              <div className="profile-success-msg" style={{ marginBottom: 16, textAlign: 'center', color: '#4ade80', fontWeight: 500, fontSize: 16 }}>{successMsg}</div>
            )}
            {error && (
              <div className="profile-error-msg" style={{ marginBottom: 16, textAlign: 'center', color: '#f87171', fontWeight: 500, fontSize: 16 }}>{error}</div>
            )}
            {!editMode && !deleteMode ? (
              <div className="profile-info-list" style={{ margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', background: 'linear-gradient(120deg, #5a3bb3 0%, #6c47ff 100%)', borderRadius: 20, boxShadow: '0 2px 12px 0 rgba(31,38,135,0.10)', padding: '24px 18px', color: '#f3f4fa' }}>
                <div className="profile-info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: 18 }}>
                  <span className="profile-label" style={{ color: '#a5b4fc', fontWeight: 500, minWidth: 120, textAlign: 'right' }}>Name</span>
                  <span className="profile-value" style={{ color: '#fff', fontWeight: 600 }}>{user?.firstName || ''} {user?.lastName || ''}</span>
                </div>
                <div className="profile-info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: 18 }}>
                  <span className="profile-label" style={{ color: '#a5b4fc', fontWeight: 500, minWidth: 120, textAlign: 'right' }}>Username</span>
                  <span className="profile-value" style={{ color: '#fff', fontWeight: 600 }}>{user?.username || ''}</span>
                </div>
                <div className="profile-info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: 18 }}>
                  <span className="profile-label" style={{ color: '#a5b4fc', fontWeight: 500, minWidth: 120, textAlign: 'right' }}>Email</span>
                  <span className="profile-value" style={{ color: '#fff', fontWeight: 600 }}>{user?.email || ''}</span>
                </div>
                <div className="profile-info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: 18 }}>
                  <span className="profile-label" style={{ color: '#a5b4fc', fontWeight: 500, minWidth: 120, textAlign: 'right' }}>Member Since</span>
                  <span className="profile-value" style={{ color: '#fff', fontWeight: 600 }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '11/5/2025'}</span>
                </div>
                <div className="profile-btn-group" style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: 24 }}>
                  <button onClick={() => setEditMode(true)} className="profile-edit-btn" style={{ background: '#18181b', color: '#fff', fontWeight: 600, fontSize: 16, borderRadius: 8, padding: '10px 28px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}>Edit Profile</button>
                  <button onClick={() => setDeleteMode(true)} className="profile-delete-btn" style={{ background: '#18181b', color: '#fff', fontWeight: 600, fontSize: 16, borderRadius: 8, padding: '10px 28px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}>Delete Account</button>
                </div>
              </div>
            ) : deleteMode ? (
              <div className="profile-delete-form" style={{ marginTop: 24 }}>
                <form onSubmit={handleDeleteAccount} className="space-y-6 max-w-2xl mx-auto">
                  <div className="bg-red-900 border border-red-700 p-6 rounded-lg">
                    <h3 className="text-xl font-medium text-red-100 mb-3">Delete Your Account</h3>
                    <p className="text-red-200 mb-5">
                      This action cannot be undone. All of your data, including projects and collaborations, will be permanently removed.
                    </p>
                    
                    <div className="mb-5">
                      <label htmlFor="confirmPassword" className="block text-gray-300 mb-2 font-medium">
                        Enter your password to confirm
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-red-700 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                    
                    <div className="pt-4 flex justify-center space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteMode(false);
                          setConfirmPassword('');
                          setError('');
                        }}
                        className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-800 transition flex items-center"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : 'Delete My Account'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="profile-edit-form" style={{ marginTop: 24 }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-gray-300 mb-1">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-gray-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="username" className="block text-gray-300 mb-1">Username</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-gray-200 mb-3">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-gray-300 mb-1">Current Password</label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                        <div>
                        <label htmlFor="newPassword" className="block text-gray-300 mb-1">New Password</label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmNewPassword" className="block text-gray-300 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          id="confirmNewPassword"
                          name="confirmNewPassword"
                          value={formData.confirmNewPassword}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>                  </div>                    <div className="pt-4 flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-800 transition flex items-center"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
