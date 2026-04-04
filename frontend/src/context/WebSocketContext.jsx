import React, { createContext, useContext, useState, useEffect } from 'react';
import WebSocketService from '../utils/websocketService';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {  const { currentUser, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [roleUpdates, setRoleUpdates] = useState([]);
  const [forceRoleRefresh, setForceRoleRefresh] = useState(0);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && !isConnected) {
      try {
        const socketInstance = WebSocketService.connect();
        
        // Set up connection event handlers
        socketInstance.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setSocket(socketInstance);
        });
        
        socketInstance.on('disconnect', () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          setActiveUsers([]);
        });        // Handle role update notifications - we'll centralize this
        // to ensure all role-related events are handled consistently
        const handleRoleUpdate = (data) => {
          console.log('💡 Role update received:', data);
          
          // Store the updated role in localStorage for persistence
          if (data.projectId && (data.role || data.newRole)) {
            const roleValue = data.newRole || data.role;
            
            // Only update localStorage if this role update is for the current user
            const currentUserId = currentUser?.id || currentUser?._id;
            const isForCurrentUser = 
              !data.userId || // No userId means it's a broadcast
              data.userId?.toString() === currentUserId?.toString(); // Or it matches current user
              
            if (isForCurrentUser) {
              console.log(`🔄 Using synchronizeRoles for project ${data.projectId} with role ${roleValue}`);
              
              // Use our centralized synchronizeRoles function instead of direct localStorage manipulation
              // This ensures consistent updates across the application
              synchronizeRoles(data.projectId, roleValue);
            }
          }
          
          // Add to our notifications queue with timestamp to ensure proper ordering
          setRoleUpdates(prev => [
            ...prev, 
            { 
              ...data, 
              timestamp: data.timestamp || new Date().toISOString(),
              _id: Math.random().toString(36).substring(2, 15) // Add unique ID for tracking
            }
          ]);
        };
          // Listen to all role-related events
        socketInstance.on('role_updated', handleRoleUpdate);
        socketInstance.on('collaborator_role_changed', handleRoleUpdate);
        socketInstance.on('your_role', handleRoleUpdate);
        socketInstance.on('role_change', handleRoleUpdate); // Additional event name that might be used

        // Handle errors
        socketInstance.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
        
        // Clean up on unmount
        return () => {
          if (isConnected) {
            WebSocketService.disconnect();
            setIsConnected(false);
            setSocket(null);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    }
  }, [isAuthenticated, currentUser, isConnected]);

  // Join a project room
  const joinProjectRoom = (projectId, sessionId = null) => {
    if (!isConnected) {
      console.error('WebSocket not connected');
      return;
    }
    
    try {
      WebSocketService.joinProject(projectId, sessionId);
      setCurrentRoomId(projectId);
      
      // Set up event listeners for this room
      const userJoinedListener = WebSocketService.onUserJoined((data) => {
        setActiveUsers(prev => {
          if (!prev.find(user => user.id === data.user.id)) {
            return [...prev, data.user];
          }
          return prev;
        });
      });
      
      const userLeftListener = WebSocketService.onUserLeft((data) => {
        setActiveUsers(prev => prev.filter(user => user.id !== data.user.id));
      });
      
      // Return cleanup function
      return () => {
        userJoinedListener();
        userLeftListener();
        
        if (currentRoomId) {
          WebSocketService.leaveProject(currentRoomId, sessionId);
          setCurrentRoomId(null);
        }
      };
    } catch (error) {
      console.error('Error joining project room:', error);
    }
  };

  // Send code changes to the server
  const sendCodeChanges = (code, cursorPosition = null) => {
    if (!isConnected || !currentRoomId) {
      console.error('Cannot send code changes: Not connected or no active room');
      return;
    }
    
    WebSocketService.sendCodeChanges(currentRoomId, code, cursorPosition);
  };

  // Send cursor position to the server
  const sendCursorPosition = (cursorPosition) => {
    if (!isConnected || !currentRoomId) {
      console.error('Cannot send cursor position: Not connected or no active room');
      return;
    }
    
    WebSocketService.sendCursorPosition(currentRoomId, cursorPosition);
  };

  // Send chat message to the server
  const sendChatMessage = (message, sessionId) => {
    if (!isConnected || !currentRoomId) {
      console.error('Cannot send chat message: Not connected or no active room');
      return;
    }
    
    WebSocketService.sendChatMessage(currentRoomId, message, sessionId);
  };

  // Register listeners for code updates
  const onCodeUpdate = (callback) => {
    if (!isConnected) {
      console.error('Cannot register for code updates: Not connected');
      return () => {};
    }
    
    return WebSocketService.onCodeUpdate(callback);
  };

  // Register listeners for cursor updates
  const onCursorUpdate = (callback) => {
    if (!isConnected) {
      console.error('Cannot register for cursor updates: Not connected');
      return () => {};
    }
    
    return WebSocketService.onCursorUpdate(callback);
  };

  // Register listeners for chat messages
  const onChatMessage = (callback) => {
    if (!isConnected) {
      console.error('Cannot register for chat messages: Not connected');
      return () => {};
    }
    
    return WebSocketService.onChatMessage(callback);
  };  // Function to get the current role for a project
  const getProjectRole = (projectId) => {
    if (!projectId) return null;
    
    // Get role from localStorage
    const role = localStorage.getItem('project_role_' + projectId);
    
    return role || 'viewer'; // Default to viewer if no role is set
  };
  
  // Function to check if the user has a specific permission level for a project
  const hasProjectPermission = (projectId, requiredRole) => {
    if (!projectId) return false;
    
    const currentRole = getProjectRole(projectId);
    
    // Permission hierarchy: admin > editor > viewer
    if (requiredRole === 'admin') {
      return currentRole === 'admin';
    } else if (requiredRole === 'editor') {
      return currentRole === 'admin' || currentRole === 'editor';
    } else {
      // Everyone has at least viewer permissions
      return true;
    }
  };
  
  // Function to synchronize roles across the application
  const synchronizeRoles = (projectId, role) => {
    // Update local state
    if (projectId && role) {
      console.log(`🔄 WebSocketContext: Synchronizing role for project ${projectId} to ${role}`);
      
      // Update localStorage
      localStorage.setItem('project_role_' + projectId, role);
      localStorage.setItem('project_role_timestamp_' + projectId, Date.now());
      
      // Broadcast a custom event to update all components listening for role changes
      document.dispatchEvent(new CustomEvent('roleUpdated', { 
        detail: { 
          projectId,
          newRole: role,
          timestamp: Date.now()
        }
      }));
      
      // Also emit a more specific event for targeted animations
      document.dispatchEvent(new CustomEvent('roleAnimation', {
        detail: {
          projectId,
          role,
          timestamp: Date.now()
        }
      }));
      
      // Increment force refresh counter to trigger reloads where needed
      setForceRoleRefresh(prev => prev + 1);
    }
  };
    // Context value
  const value = {
    isConnected,
    activeUsers,
    currentRoomId,
    socket,
    roleUpdates,
    forceRoleRefresh,
    joinProjectRoom,
    sendCodeChanges,
    sendCursorPosition,
    sendChatMessage,
    onCodeUpdate,
    onCursorUpdate,
    onChatMessage,
    synchronizeRoles,
    getProjectRole,
    hasProjectPermission
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
