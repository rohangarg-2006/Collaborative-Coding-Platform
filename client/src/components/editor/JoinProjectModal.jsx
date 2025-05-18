import React, { useState } from 'react';

const JoinProjectModal = ({ isOpen, onClose, onJoin, isLoading }) => {
  const [inviteCode, setInviteCode] = useState('');
  
  const handleChange = (e) => {
    setInviteCode(e.target.value.toUpperCase());
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      onJoin(inviteCode);
    }
  };
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Join a Project</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>          <div className="mb-6">
            <label 
              htmlFor="inviteCode" 
              className="block text-gray-700 dark:text-gray-300 mb-2 font-medium text-lg"
            >
              Enter Project Invite Code
            </label>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 mb-4 rounded-md border border-indigo-100 dark:border-indigo-800">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-indigo-700 dark:text-indigo-300">How it works:</span> Each project has a unique 6-character invite code that allows collaborators to join. Ask the project owner to share their code with you.
              </p>
            </div>
            
            <div className="relative">
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 border-2 border-indigo-300 dark:border-indigo-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase text-center font-mono text-xl tracking-wider"
                placeholder="ABC123"
                maxLength="6"
                autoFocus
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              The invite code is case-insensitive and should be 6 characters
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !inviteCode.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : 'Join Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinProjectModal;
