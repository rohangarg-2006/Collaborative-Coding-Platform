import React, { useState, useRef, useEffect } from 'react';

const EditorChat = ({ messages, sendMessage, currentUser }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };
  
  // Format timestamps
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-2 bg-indigo-600 text-white">
        <h3 className="font-medium">Chat</h3>
      </div>
      
      {/* Messages container */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${msg.user?.id === currentUser?.id ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`px-3 py-2 rounded-lg max-w-[85%] break-words ${
                  msg.user?.id === currentUser?.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                }`}
              >
                {/* Username if not the current user */}
                {msg.user?.id !== currentUser?.id && (
                  <div className="font-medium text-xs text-indigo-600 dark:text-indigo-400">
                    {msg.user?.username || 'Anonymous'}
                  </div>
                )}
                
                {/* Message content */}
                <p>{msg.content}</p>
                
                {/* Timestamp */}
                <div className={`text-xs mt-1 ${
                  msg.user?.id === currentUser?.id
                    ? 'text-indigo-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 disabled:bg-indigo-400 transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditorChat;
