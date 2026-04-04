import React from 'react';
import './user-cursor.css';

const UserCursor = ({ user, position }) => {
  if (!user || !position) {
    return null;
  }

  // Generate a stable color from the user's ID
  const generateColor = (userId) => {
    const colorClasses = [
      { bg: '#ef4444', name: 'red' },      // Red
      { bg: '#3b82f6', name: 'blue' },     // Blue
      { bg: '#10b981', name: 'green' },    // Green
      { bg: '#f59e0b', name: 'amber' },    // Amber
      { bg: '#8b5cf6', name: 'purple' },   // Purple
      { bg: '#ec4899', name: 'pink' },     // Pink
      { bg: '#06b6d4', name: 'cyan' },     // Cyan
      { bg: '#14b8a6', name: 'teal' }      // Teal
    ];
    
    // Simple hash function to get a consistent color for each user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Use absolute value and modulo to get index in color array
    const colorIndex = Math.abs(hash) % colorClasses.length;
    return colorClasses[colorIndex];
  };

  const cursorColor = generateColor(user.id);
  
  // Ensure position values are valid numbers
  const left = typeof position.left === 'number' ? position.left : 0;
  const top = typeof position.top === 'number' ? position.top : 0;

  return (
    <div
      className="user-cursor-container"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 1000,
        pointerEvents: 'none',
        // Use fixed positioning for page-absolute coordinates
      }}
    >
      {/* Cursor Line - Accurately positioned */}
      <div 
        className="cursor-line"
        style={{
          backgroundColor: cursorColor.bg,
          boxShadow: `0 0 6px ${cursorColor.bg}`,
          height: position.height || '20px'
        }}
      />
      
      {/* Username Tag */}
      <div 
        className="cursor-label"
        style={{
          backgroundColor: cursorColor.bg,
          color: 'white',
          boxShadow: `0 2px 8px ${cursorColor.bg}40`,
        }}
        title={`${user.username || user.name || 'Anonymous'} is here`}
      >
        <span className="cursor-username">
          {user.username || user.name || 'Anonymous'}
        </span>
      </div>
    </div>
  );
};

export default UserCursor;
