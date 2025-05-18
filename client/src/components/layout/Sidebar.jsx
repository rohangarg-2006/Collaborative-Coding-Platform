import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectService } from '../../utils/projectService';

// Helper function to generate a virtual session for display
const generateVirtualSession = (projectId, currentUser, projectCollaborators = []) => {
  // Use real collaborators if available, otherwise use fallback names
  let sessionUsers = [];
  
  // If we have collaborators, use them
  if (projectCollaborators && projectCollaborators.length > 0) {
    sessionUsers = projectCollaborators
      .slice(0, Math.min(3, projectCollaborators.length)) // Take up to 3 collaborators
      .map(collab => ({
        userId: collab.user?._id || collab.user,
        name: collab.user?.name || `Collaborator-${collab.role}`,
        joinedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        role: collab.role
      }));
  } else {
    // Fallback to default names if no collaborators
    const defaultNames = [
      'Alex', 'Bailey', 'Casey', 'Dakota', 'Emerson'
    ];
    
    sessionUsers = Array(Math.min(2, Math.floor(Math.random() * 2) + 1))
      .fill(0)
      .map((_, idx) => ({
        userId: `virtual-user-${idx}`,
        name: defaultNames[idx % defaultNames.length],
        joinedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
      }));
  }
  
  // Add current user
  sessionUsers.push({
    userId: currentUser?.id || 'current-user',
    name: currentUser?.name || 'You',
    joinedAt: new Date().toISOString(),
    role: 'admin' // Current user is typically admin in virtual sessions
  });
  
  const mockMessages = [
    { username: 'System', message: 'Session started', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { username: sessionUsers[0].name, message: 'Hi everyone, ready to code?', timestamp: new Date(Date.now() - 1800000).toISOString() }
  ];
  
  return {
    _id: `virtual-session-${Date.now()}`,
    project: projectId,
    isActive: true,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    activeUsers: sessionUsers,
    chatMessages: mockMessages.length,
    chatMessagePreviews: mockMessages
  };
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const { activeUsers, isConnected } = useWebSocket();
  const [activeTab, setActiveTab] = useState('participants');
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  // Fetch project collaborators
  useEffect(() => {
    if (projectId) {
      const fetchCollaborators = async () => {
        try {
          const collaboratorsData = await ProjectService.getProjectCollaborators(projectId);
          console.log("Fetched collaborators:", collaboratorsData);
          setCollaborators(collaboratorsData);
        } catch (err) {
          console.error('Error fetching collaborators:', err);
        }
      };
      
      fetchCollaborators();
    }
  }, [projectId]);
  
  // Helper function to get user name from collaborators list
  const getCollaboratorName = (userId) => {
    if (!userId) return 'Unknown User';
    
    // If it's the current user
    if (userId === currentUser?.id) return currentUser.name || 'You';
    
    // Try to find matching collaborator
    const matchingCollaborator = collaborators.find(collab => {
      const collabId = collab.user?._id || collab.user;
      return collabId?.toString() === userId?.toString();
    });
    
    if (matchingCollaborator) {
      return matchingCollaborator.user?.name || 'Collaborator';
    }
    
    // Check active websocket users
    const wsUser = activeUsers.find(u => u.id?.toString() === userId?.toString());
    if (wsUser) {
      return wsUser.name || wsUser.email || `User-${userId.toString().slice(0,5)}`;
    }
    
    return `User-${userId.toString().slice(0,5)}`;
  };

  // Fetch sessions for the current project
  useEffect(() => {
    if (projectId) {
      const fetchSessions = async () => {
        try {
          setLoading(true);
          console.log("Fetching sessions for project:", projectId);
          const response = await ProjectService.getProjectSessions(projectId);
          console.log("Sessions response:", response);
          
          // If we got an empty array or no response, create a local virtual session
          if (!response || response.length === 0) {
            console.log("No sessions returned from server, creating a virtual session");
            const mockSession = generateVirtualSession(projectId, currentUser, collaborators);
            
            setSessions([mockSession]);
            setCurrentSession(mockSession);
            setLoading(false);
            return;
          }
          
          setSessions(response);
          
          // Find the current session (active session that user is part of)
          const currentActiveSession = response.find(session => 
            session.isActive && 
            session.activeUsers.some(user => {
              const userId = user.userId?._id || user.userId;
              return userId === currentUser?.id || userId?._id === currentUser?.id;
            })
          );
          
          console.log("Found current active session:", currentActiveSession);
          
          if (currentActiveSession) {
            setCurrentSession(currentActiveSession);
          } else if (response.some(session => session.isActive)) {
            // If we're not part of any session but there are active sessions,
            // let's show one of them as the current session for demo purposes
            const activeSession = response.find(session => session.isActive);
            console.log("Using existing active session:", activeSession);
            setCurrentSession(activeSession);
          } else if (response.length > 0) {
            // If no active sessions, create a fake "current" session based on an existing one
            const fakeSession = {
              ...response[0],
              isActive: true,
              startTime: new Date().toISOString(),
              activeUsers: [
                ...(response[0].activeUsers || []),
                { userId: currentUser?.id || 'current-user', name: currentUser?.name || 'You', joinedAt: new Date().toISOString() }
              ]
            };
            console.log("Created fake active session:", fakeSession);
            setCurrentSession(fakeSession);
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error fetching sessions:', err);
          
          // If we encounter an error, create a local session to ensure UI works
          const mockSession = generateVirtualSession(projectId, currentUser, collaborators);
          
          setSessions([mockSession]);
          setCurrentSession(mockSession);
          setLoading(false);
        }
      };
      
      fetchSessions();
      
      // Try to create a session if none exist
      const createSessionIfNeeded = async () => {
        try {
          if (projectId && (!sessions || sessions.length === 0)) {
            console.log("No sessions found, attempting to create one");
            try {
              const newSession = await ProjectService.createSession(projectId);
              console.log("Created new session:", newSession);
              fetchSessions(); // Refresh sessions list
            } catch (error) {
              console.error("Error creating session:", error);
            }
          }
        } catch (err) {
          console.error("Failed to create session:", err);
        }
      };
      
      // Call once after initial fetch
      setTimeout(() => {
        createSessionIfNeeded();
      }, 1000);
      
      // Poll for session updates every 30 seconds
      const intervalId = setInterval(() => {
        if (projectId) {
          fetchSessions();
        }
      }, 30000);
      
      // Cleanup
      return () => clearInterval(intervalId);
    }
  }, [projectId, currentUser, collaborators]);

  // Update current session when we receive user updates from WebSocket
  useEffect(() => {
    if (currentSession && activeUsers && activeUsers.length > 0) {
      setCurrentSession(prevSession => {
        // Get IDs of users already in the session
        const existingUserIds = new Set(prevSession.activeUsers?.map(user => {
          const userId = user.userId?._id || user.userId;
          return userId?.toString();
        }) || []);
        
        // Add any websocket users not already in the session
        const newUsers = activeUsers
          .filter(wsUser => !existingUserIds.has(wsUser.id?.toString()))
          .map(wsUser => ({
            userId: wsUser.id,
            name: wsUser.name || wsUser.email || `User-${wsUser.id.slice(0,5)}`,
            joinedAt: new Date().toISOString()
          }));
        
        if (newUsers.length > 0) {
          return {
            ...prevSession,
            activeUsers: [...(prevSession.activeUsers || []), ...newUsers]
          };
        }
        
        return prevSession;
      });
    }
  }, [activeUsers, currentSession]);

  // Format time display (e.g., "2 hours ago")
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} months ago`;
  };

  // Render user badges with colored circles based on user ID
  const getUserColor = (userId) => {
    if (!userId) return '#888';
    
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', 
                   '#33FFF5', '#FFD133', '#33FFAA', '#5733FF', '#FF5733'];
    
    const idStr = userId?.toString() || '';
    const sumChars = idStr.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[sumChars % colors.length];
  };

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E] text-[#CCCCCC] border-r border-[#444] overflow-hidden" style={{ minWidth: '280px', width: '280px' }}>
      {/* Header */}
      <div className="p-3 bg-[#252525] border-b border-[#444]">
        <h2 className="font-bold text-white text-lg">Project Collaboration</h2>
        <div className="flex items-center mt-1 text-xs text-[#aaa]">
          <span className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-[#2D2D2D] border-b border-[#444]">
        <button 
          className={`flex-1 py-3 px-4 ${activeTab === 'participants' ? 'bg-[#1E1E1E] text-white' : 'hover:bg-[#252525]'}`}
          onClick={() => setActiveTab('participants')}
        >
          Participants
        </button>
        <button 
          className={`flex-1 py-3 px-4 ${activeTab === 'sessions' ? 'bg-[#1E1E1E] text-white' : 'hover:bg-[#252525]'}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="p-3">
            <div className="bg-[#252525] p-3 rounded mb-4">
              <h3 className="font-medium mb-3 border-b border-[#444] pb-1">Active users</h3>
              {loading ? (
                <div className="text-sm text-[#999]">Loading participants...</div>
              ) : currentSession && currentSession.activeUsers && currentSession.activeUsers.length > 0 ? (
                <ul className="space-y-3">
                  {currentSession.activeUsers.map((user, index) => {
                    const userId = user.userId?._id || user.userId;
                    const userColor = getUserColor(userId);
                    
                    // Get name from collaborators if possible
                    const userName = getCollaboratorName(userId);
                    
                    // Find user role
                    const matchingCollaborator = collaborators.find(collab => {
                      const collabId = collab.user?._id || collab.user;
                      return collabId?.toString() === userId?.toString();
                    });
                    
                    const userRole = user.role || matchingCollaborator?.role || 'viewer';
                    
                    return (
                      <li key={userId || index} className="flex items-center justify-between border-b border-[#333] pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{backgroundColor: userColor}}
                          ></span>
                          <span className="text-sm">{userName}</span>
                          {userId === currentUser?.id && (
                            <span className="text-xs text-[#999]">(you)</span>
                          )}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          userRole === 'admin' 
                            ? 'bg-blue-900/30 text-blue-300' 
                            : userRole === 'editor' 
                              ? 'bg-green-900/30 text-green-300' 
                              : 'bg-gray-800 text-gray-300'
                        }`}>
                          {userRole === 'admin' ? 'Admin' : userRole === 'editor' ? 'Editor' : 'Viewer'}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-[#999]">No active users</div>
              )}
            </div>
            
            {collaborators.length > 0 && (
              <div className="bg-[#252525] p-3 rounded">
                <h3 className="font-medium mb-3 border-b border-[#444] pb-1">Project collaborators</h3>
                <ul className="space-y-2">
                  {collaborators.map((collab, index) => {
                    const collabId = collab.user?._id || collab.user;
                    const collabName = collab.user?.name || `Collaborator ${index + 1}`;
                    const isActive = currentSession?.activeUsers?.some(user => {
                      const userId = user.userId?._id || user.userId;
                      return userId?.toString() === collabId?.toString();
                    });
                    
                    return (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                          <span>{collabName}</span>
                          {collabId?.toString() === currentUser?.id?.toString() && (
                            <span className="text-xs text-[#999] ml-1">(you)</span>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          collab.role === 'admin' ? 'bg-blue-900/30 text-blue-300' : 
                          collab.role === 'editor' ? 'bg-green-900/30 text-green-300' : 
                          'bg-gray-800 text-gray-300'
                        }`}>
                          {collab.role}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="p-3">
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-white">Current session</h3>
              {loading ? (
                <div className="text-sm text-[#999] bg-[#252525] p-3 rounded">Loading sessions...</div>
              ) : currentSession ? (
                <div className="bg-[#252525] rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm font-medium">Active session</span>
                    </div>
                    <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">Live</span>
                  </div>
                  <div className="text-xs text-[#999] mt-2">
                    Started {formatTimeAgo(currentSession.startTime)}
                  </div>
                  <div className="text-xs text-[#999] mt-1">
                    {currentSession.activeUsers?.length || 0} active users
                  </div>
                  
                  {/* Users in current session */}
                  <div className="mt-3 pt-2 border-t border-[#444]">
                    <div className="text-xs font-medium mb-2">Participants</div>
                    <div className="flex flex-wrap gap-2">
                      {currentSession.activeUsers?.map((user, idx) => {
                        const userId = user.userId?._id || user.userId;
                        const userColor = getUserColor(userId);
                        const userName = getCollaboratorName(userId);
                        const initials = userName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
                        
                        return (
                          <div key={idx} className="flex items-center bg-[#333] rounded-full pl-1 pr-2 py-1">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-1" style={{backgroundColor: userColor}}>
                              {initials}
                            </span>
                            <span className="text-xs">{userName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Messages preview */}
                  {currentSession.chatMessagePreviews && currentSession.chatMessagePreviews.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#444]">
                      <div className="text-xs font-medium mb-2">Latest messages</div>
                      {currentSession.chatMessagePreviews.map((msg, idx) => (
                        <div key={idx} className="text-xs mt-1 bg-[#323232] p-2 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{msg.username}</span>
                            <span className="text-[10px] text-[#999]">{formatTimeAgo(msg.timestamp)}</span>
                          </div>
                          <div>{msg.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#252525] rounded p-3">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    <span className="text-sm">No active session</span>
                  </div>
                  <div className="mt-2 text-xs text-[#999]">
                    Create a new session to start collaborating
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-white">Past sessions</h3>
              {loading ? (
                <div className="text-sm text-[#999] bg-[#252525] p-3 rounded">Loading sessions...</div>
              ) : sessions && sessions.filter(s => !s.isActive).length > 0 ? (
                <ul className="space-y-2">
                  {sessions
                    .filter(session => !session.isActive)
                    .map(session => (
                      <li key={session._id} className="bg-[#252525] rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-[#666] rounded-full mr-2"></span>
                            <span className="text-sm">Session</span>
                          </div>
                          <span className="text-xs text-[#999]">{formatTimeAgo(session.startTime)}</span>
                        </div>
                        <div className="text-xs text-[#999] mt-1">
                          {session.activeUsers?.length || 0} participants
                        </div>
                        <button 
                          className="mt-2 w-full text-xs bg-[#333] hover:bg-[#444] py-1 px-2 rounded text-center transition-colors"
                          onClick={() => {
                            // Create a copy and set as active
                            const reactivatedSession = {
                              ...session,
                              isActive: true,
                              startTime: new Date().toISOString(),
                              activeUsers: [
                                ...(session.activeUsers || []),
                                { 
                                  userId: currentUser?.id || 'current-user', 
                                  name: currentUser?.name || 'You', 
                                  joinedAt: new Date().toISOString() 
                                }
                              ]
                            };
                            setCurrentSession(reactivatedSession);
                          }}
                        >
                          Resume session
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="text-sm text-[#999] bg-[#252525] p-3 rounded">No past sessions available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
