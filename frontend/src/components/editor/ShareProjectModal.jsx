import React, { useState } from 'react';

const ShareProjectModal = ({ isOpen, onClose, project }) => {
  const [copyStatus, setCopyStatus] = useState('');
  if (!isOpen || !project) {
    return null;
  }
  
  // If the project is private, don't allow sharing
  const isPrivate = project && project.isPublic === false;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(''), 3000);
      },
      () => {
        setCopyStatus('Failed to copy');
      }
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Share Project</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>        <div className="mb-6">
          {isPrivate ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Private Project</h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>This project is set to private. Private projects cannot be shared with other users. To enable collaboration, please update the project to be public in the project settings.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Share this invite code with your collaborators to allow them to join your project.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Invite Code
                </label>
                <div className="flex">
                  <input
                    readOnly
                    value={project.inviteCode || 'No invite code available'}
                    className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-l-md font-mono text-center focus:outline-none"
                  />
                  <button
                    onClick={() => project.inviteCode && copyToClipboard(project.inviteCode)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-r-md transition"
                    disabled={!project.inviteCode}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
                {copyStatus && (
                  <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {copyStatus}
                  </p>
                )}
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Note:</span> Anyone with this code can join this project. 
                  For security, you should only share it with people you trust.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
