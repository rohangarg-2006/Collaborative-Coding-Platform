import React from 'react';

const UserCursor = ({ user, position }) => {
  if (!user || !position) {
    return null;
  }

  // Generate a stable color from the user's ID
  const generateColor = (userId) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    // Simple hash function to get a consistent color for each user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Use absolute value and modulo to get index in color array
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const cursorColor = generateColor(user.id);
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.left}px`,
        top: `${position.top}px`,
        zIndex: 10,
        pointerEvents: 'none',
      }}
      className="flex flex-col items-start"
    >
      {/* Cursor */}
      <div className={`w-0.5 h-5 ${cursorColor}`} />
      
      {/* Username tag */}
      <div 
        className={`${cursorColor} text-white text-xs px-1 py-0.5 rounded truncate max-w-[100px]`}
        style={{ marginTop: '-5px' }}
      >
        {user.username || user.name || 'Anonymous'}
      </div>
    </div>
  );
};

export default UserCursor;
