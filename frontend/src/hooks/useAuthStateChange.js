import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

/**
 * Custom hook to handle authentication changes and WebSocket connections
 * This hook will automatically handle reconnecting WebSockets when auth state changes
 */
export const useAuthStateChange = (callback) => {
  const { isAuthenticated, loading } = useAuth();
  const { isConnected } = useWebSocket();
  
  useEffect(() => {
    // Only run the effect if authentication is loaded
    if (!loading) {
      // Run the callback when auth state changes
      if (callback && typeof callback === 'function') {
        callback(isAuthenticated);
      }
      
      // We can do additional handling here
      if (isAuthenticated && !isConnected) {
        console.log('Authentication detected - WebSocket should connect');
      } else if (!isAuthenticated && isConnected) {
        console.log('Logout detected - WebSocket should disconnect');
      }
    }
  }, [isAuthenticated, isConnected, loading, callback]);
  
  return {
    isAuthenticated,
    loading,
    isConnected
  };
};

export default useAuthStateChange;
