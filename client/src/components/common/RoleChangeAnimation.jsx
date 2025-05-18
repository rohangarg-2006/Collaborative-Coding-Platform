import React, { useState, useEffect, useRef } from 'react';
import { 
  getRoleDisplayName,
  getRoleBadgeClasses,
  getRoleRenderKey
} from '../../utils/roleUtils';

/**
 * A component that shows a subtle animation when a user's role changes
 * Can be used in any part of the UI that displays roles
 */
const RoleChangeAnimation = ({ role, projectId, showFullName = false, compact = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevRole, setPrevRole] = useState(role);
  const [upgradeTransition, setUpgradeTransition] = useState(false); // Track if the role was upgraded or downgraded
  const animationTimeoutRef = useRef(null);
  
  // Icons for different roles
  const roleIcons = {
    admin: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    editor: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
    viewer: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    )
  };
  
  // Role priority mapping (used to determine if role was upgraded or downgraded)
  const rolePriority = {
    admin: 3,
    editor: 2,
    viewer: 1
  };
  
  useEffect(() => {
    // Only animate if the role actually changed
    if (role !== prevRole) {
      console.log(`🎭 Role changed from ${prevRole} to ${role}`);
      
      // Determine if this was an upgrade or downgrade
      const wasRoleUpgraded = 
        (rolePriority[role] > rolePriority[prevRole]);
      
      setUpgradeTransition(wasRoleUpgraded);
      setIsAnimating(true);
      
      // Store the previous role
      setPrevRole(role);
      
      // Reset animation after it completes
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 2000); // Animation duration
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [role, prevRole]);
  
  useEffect(() => {
    // Listen for role updates to trigger animation
    const handleRoleUpdate = (event) => {
      if (event.detail.projectId === projectId) {
        console.log(`🎬 Animation triggered for project ${projectId}`);
        
        // Check if we have new role information
        const newRole = event.detail.newRole || event.detail.role;
        if (newRole && newRole !== role) {
          // Determine if this was an upgrade or downgrade
          const wasRoleUpgraded = 
            (rolePriority[newRole] > rolePriority[role]);
          
          setUpgradeTransition(wasRoleUpgraded);
          setPrevRole(role);
          
          // Force a refresh after a short delay
          setTimeout(() => {
            setIsAnimating(true);
          }, 50);
          
          // Reset animation after it completes
          if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
          }
          
          animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
          }, 2000);
        } else {
          // Just animate without changing roles (e.g., for confirmations)
          setIsAnimating(true);
          
          // Reset animation
          if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
          }
          
          animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
          }, 1500);
        }
      }
    };
    
    // Listen specifically for the animation event
    document.addEventListener('roleAnimation', handleRoleUpdate);
    
    return () => {
      document.removeEventListener('roleAnimation', handleRoleUpdate);
    };
  }, [projectId, role]);
  
  // Generate unique key to force re-render on role change
  const renderKey = getRoleRenderKey(projectId, role);
  
  // Apply proper Tailwind classes for consistent styling
  const badgeClasses = getRoleBadgeClasses(role);
  
  return (
    <div 
      key={renderKey}
      className={`
        transition-all duration-700 ease-in-out 
        ${isAnimating ? 'scale-110' : 'scale-100'}
        ${isAnimating && upgradeTransition ? 'animate-role-upgrade' : ''}
        ${isAnimating && !upgradeTransition ? 'animate-role-downgrade' : ''}
      `}
    >      <span className={`role-badge inline-flex items-center rounded-md font-medium ${badgeClasses}`}>
        {roleIcons[role] || roleIcons.viewer}
        {showFullName ? 
          (role === 'editor' ? 'Editor' : 
           role === 'admin' ? 'Admin' : 
           role === 'viewer' ? 'Viewer' : 
           role.charAt(0).toUpperCase() + role.slice(1)) : 
          role.charAt(0).toUpperCase() + role.slice(1)}
        {isAnimating && (
          <span className="ml-1 animate-pulse">✨</span>
        )}
      </span>
    </div>
  );
};

export default RoleChangeAnimation;
