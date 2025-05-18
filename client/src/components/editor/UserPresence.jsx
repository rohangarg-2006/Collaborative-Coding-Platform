import React from 'react';

const UserPresence = ({ activeUsers, currentUser }) => {
  // Filter out current user from the list
  const otherUsers = activeUsers?.filter(user => user.id !== currentUser?.id) || [];
  
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
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };
  
  if (!otherUsers.length) {
    return (
      <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          No other users are currently active.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Active Users ({otherUsers.length})
      </h3>
      
      <div className="space-y-2">
        {otherUsers.map(user => (
          <div key={user.id} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${generateColor(user.id)}`} />
            <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
              {user.username || user.name || 'Anonymous'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPresence;
