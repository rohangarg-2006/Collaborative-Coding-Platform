import { io } from 'socket.io-client';
import AuthService from './authService';

// WebSocket API URL
const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://codecollab-backend-1org.onrender.com';

// Initialize socket connection - null until connect is called
let socket = null;

const WebSocketService = {
  // Connect to the WebSocket server
  connect: () => {
    if (socket) return socket;
    
    const token = AuthService.getToken();
    
    if (!token) {
      throw new Error('Authentication required to connect to WebSocket server');
    }
    
    // Create socket connection with auth token
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true
    });
    
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });
    
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    return socket;
  },
  
  // Disconnect from WebSocket server
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  
  // Join a project room
  joinProject: (projectId, sessionId = null) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.emit('join-project', { projectId, sessionId });
  },
  
  // Listen for your role in a project
  onYourRoleAssigned: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    // Listen for your role assignment
    socket.on('your_role', (data) => {
      console.log('Received role assignment:', data);
      
      // If we're assigned a role and we're the project owner, make sure it's admin
      const currentUser = AuthService.getStoredUser();
      
      if (data && data.projectId && data.role && currentUser) {
        // Store the assigned role in localStorage for persistence
        localStorage.setItem('project_role_' + data.projectId, data.role);
      }
      
      if (callback) {
        callback(data);
      }
    });
    
    // Return a function to remove the listener
    return () => {
      socket.off('your_role');
    };
  },
  
  // Leave a project room
  leaveProject: (projectId, sessionId = null) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.emit('leave-project', { projectId, sessionId });
  },
  
  // Generic method to emit custom events
  emitEvent: (eventName, data) => {
    if (!socket) {
      console.error('Not connected to WebSocket server - cannot emit event:', eventName);
      return;
    }
    
    console.log(`Emitting event: ${eventName}`, data);
    socket.emit(eventName, data);
  },  // Verify and enforce admin status for project creators/owners
  enforceAdminStatus: (projectId, userId) => {
    if (!socket) {
      console.error('Not connected to WebSocket server - cannot verify admin status');
      return;
    }
    
    if (!projectId || !userId) {
      console.error('Missing projectId or userId for admin status verification');
      return;
    }
    
    // Check if this user is the creator/owner of the project
    const isCreator = localStorage.getItem('project_creator_' + projectId) === 'true';
    const storedRole = localStorage.getItem('project_role_' + projectId);
    
    // Always enforce admin status for creators - this is CRITICAL
    if (isCreator) {
      console.log('Enforcing admin status for project creator', { projectId, userId, isCreator, storedRole });
      // Always set localStorage to admin if they're the creator
      localStorage.setItem('project_role_' + projectId, 'admin');
      
      // Emit event to verify admin status on server with high priority
      socket.emit('verify_admin_status', { projectId, userId, priority: 'high' });
      return 'admin'; // Return admin role for creators
    }
    
    // For non-creators, verify admin role if that's what they're supposed to have
    if (storedRole === 'admin') {
      console.log('Verifying admin status for user with admin role', { projectId, userId, storedRole });
      socket.emit('verify_admin_status', { projectId, userId });
    }
    
    // Return any stored role or default to viewer
    return storedRole || 'viewer';
  },
  
  // Send code changes
  sendCodeChanges: (projectId, code, cursorPosition = null, version = null) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.emit('code-change', { 
      projectId, 
      code, 
      cursorPosition, 
      version 
    });
  },
  
  // Send cursor position updates
  sendCursorPosition: (projectId, cursorPosition) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.emit('cursor-move', { projectId, cursorPosition });
  },
  
  // Send chat message
  sendChatMessage: (projectId, message, sessionId = null) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.emit('send-chat', { projectId, message, sessionId });
  },
  
  // Subscribe to code updates
  onCodeUpdate: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.on('code-update', callback);
    
    // Return unsubscribe function
    return () => socket.off('code-update', callback);
  },
  
  // Subscribe to cursor updates
  onCursorUpdate: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.on('cursor-update', callback);
    
    // Return unsubscribe function
    return () => socket.off('cursor-update', callback);
  },
  
  // Subscribe to user joining events
  onUserJoined: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.on('user-joined', callback);
    
    // Return unsubscribe function
    return () => socket.off('user-joined', callback);
  },
  
  // Subscribe to user leaving events
  onUserLeft: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.on('user-left', callback);
    
    // Return unsubscribe function
    return () => socket.off('user-left', callback);
  },
  
  // Subscribe to chat message events
  onChatMessage: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.on('chat-message', callback);
    
    // Return unsubscribe function
    return () => socket.off('chat-message', callback);
  },
  
  // Subscribe to session events
  onSessionJoined: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socket.on('session-joined', callback);
    
    // Return unsubscribe function
    return () => socket.off('session-joined', callback);
  },
  // Subscribe to role update events and collaborator removals
  onRoleUpdated: (callback) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    // Listen to all role-related events
    socket.on('role_updated', callback);
    socket.on('collaborator_role_changed', callback);
    socket.on('your_role', callback);
    socket.on('collaborator_removed', callback);
    socket.on('project_update', (data) => {
      // Process role-related project updates and collaborator removals
      if (data.type === 'role_change' || data.type === 'collaborator_removed') {
        callback(data);
      }
    });
    
    // Return a combined unsubscribe function
    return () => {
      socket.off('role_updated', callback);
      socket.off('collaborator_role_changed', callback);
      socket.off('your_role', callback);
      socket.off('collaborator_removed', callback);
      socket.off('project_update');
    };
  },
  
  // Method to broadcast a role update to ensure real-time propagation
  broadcastRoleChange: (projectId, userId, role, updatedBy) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    const data = {
      projectId,
      userId,
      newRole: role,
      role: role,
      updatedBy: updatedBy || 'Admin',
      timestamp: new Date().toISOString()
    };
    
    socket.emit('update_role', data);
  },
  
  // Method to broadcast collaborator removal to ensure real-time propagation
  broadcastCollaboratorRemoval: (projectId, userId, userName, removedBy) => {
    if (!socket) {
      throw new Error('Not connected to WebSocket server');
    }
    
    const data = {
      projectId,
      userId,
      userName,
      removedBy: removedBy || 'Admin',
      timestamp: new Date().toISOString(),
      type: 'collaborator_removed'
    };
    
    // Emit both specific and general events for better coverage
    socket.emit('collaborator_removed', data);
    socket.emit('project_update', data);
  },
  
  // Get current socket instance
  getSocket: () => socket
};

export default WebSocketService;
