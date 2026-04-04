import React, { useState, useEffect } from 'react';
import { getRoleBadgeClasses, saveUserRole, getRoleDisplayName } from '../../utils/roleUtils';

const RoleChangeNotification = ({ message, role, onClose }) => {  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    
    // Always make visible when there's a new message
    setVisible(true);
    
    // Auto-hide after 6 seconds (balanced visibility without being intrusive)
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [message, onClose]);
  
  // Effect triggered specifically for role changes
  useEffect(() => {
    if (role) {
      // Force visibility when role changes
      setVisible(true);
      
      // Extract projectId from URL path rather than query param
      // The correct format is /editor/:projectId
      const pathParts = window.location.pathname.split('/');
      const projectId = pathParts.length > 2 ? pathParts[2] : null;
      
      if (projectId) {
        saveUserRole(projectId, role);
      }
    }
  }, [role]);
  
  if (!visible || !message) return null;
  
  // Determine styling based on role
  let bannerClass = "role-mode-banner";
  let icon = null;
  
  if (role === 'viewer') {
    bannerClass += " view-mode";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    );
  } else if (role === 'editor') {
    bannerClass += " edit-mode";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    );  } else if (role === 'admin') {
    bannerClass += " admin-mode";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }
  
  return (
    <div className={`${bannerClass} ${!visible ? 'fade-out' : ''}`}>
      {icon}
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        className="ml-auto pl-3 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default RoleChangeNotification;
