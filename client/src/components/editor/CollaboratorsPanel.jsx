import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { ProjectService } from '../../utils/projectService';
import WebSocketService from '../../utils/websocketService';
import RoleChangeNotification from './RoleChangeNotification';
import RoleChangeAnimation from '../common/RoleChangeAnimation';
import { 
  getUserRole, 
  getRoleBadgeClasses, 
  getRoleDisplayName, 
  hasPermission 
} from '../../utils/roleUtils';
import './collaborators-panel.css';

const CollaboratorsPanel = ({ projectDetails, isAdmin = false, onClose, userRole: parentUserRole }) => {
  // Group all useState declarations at the top for clarity
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [roleChangeKey, setRoleChangeKey] = useState(0);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState(null);
  
  const { currentUser } = useAuth();
  const { projectId } = useParams();
  const { socket } = useWebSocket();

  // Load collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        setLoading(true);
        const response = await ProjectService.getProjectCollaborators(projectId);
        setCollaborators(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collaborators:', err);
        setError('Failed to load collaborator information');
        setLoading(false);
      }
    };

    if (projectId) {
      fetchCollaborators();
    }
  }, [projectId]);

  // Listen for role updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleRoleUpdate = (data) => {
      if (data.projectId === projectId) {
        console.log('Received role update:', data);
        
        // Extract role value consistently
        const roleValue = data.newRole || data.role;
        
        if (data.userId && roleValue) {
          console.log(`Updating role for user ${data.userId} to: ${roleValue}`);
          
          try {
            // Update local state of collaborators
            setCollaborators(prev => 
              prev.map(collab => {
                const collabUserId = typeof collab.user === 'object' ? collab.user._id : collab.user;
                const targetUserId = typeof data.userId === 'object' ? data.userId._id : data.userId;
                
                return collabUserId?.toString() === targetUserId?.toString() 
                  ? { ...collab, role: roleValue } 
                  : collab;
              })
            );
            
            // If this notification is for the current user
            if (currentUser?.id?.toString() === data.userId?.toString()) {
              setNotificationMsg(`Your role has been changed to ${roleValue} by ${data.updatedBy || 'an admin'}`);
              
              // Use a safer pattern for setTimeout with cleanup
              const timer = setTimeout(() => {
                setNotificationMsg('');
              }, 3000);
              
              // Force refresh the currentUserRole by triggering a state update
              localStorage.setItem('project_role_' + projectId, roleValue);
              
              // Only update roleChangeKey if it exists as a function
              if (typeof setRoleChangeKey === 'function') {
                setRoleChangeKey(prev => prev + 1);
              }
              
              // Return cleanup function for the timer
              return () => clearTimeout(timer);
            }
          } catch (err) {
            console.error('Error handling role update:', err);
          }
        }
          // For project-wide updates or if we can't match a specific user,
        // refresh the entire collaborator list
        if (data.type === 'role_change' || !data.userId) {
          // Use a flag to prevent state updates after unmount
          let isMounted = true;
          
          // Fetch fresh collaborator data
          ProjectService.getProjectCollaborators(projectId)
            .then(updatedCollabs => {
              // Only update state if component is still mounted
              if (isMounted && updatedCollabs) {
                setCollaborators(updatedCollabs);
              }
            })
            .catch(err => {
              if (isMounted) {
                console.error('Failed to refresh collaborators list after role change:', err);
              }
            });
            
          // Return cleanup function to prevent state updates after unmount
          return () => {
            isMounted = false;
          };
        }
      }
    };
    
    // Handle collaborator removal
    const handleCollaboratorRemoved = (data) => {
      if (data.projectId === projectId) {
        console.log('Received collaborator removal:', data);
        
        // If current user was removed
        if (currentUser?.id?.toString() === data.userId?.toString()) {
          setNotificationMsg(`You have been removed from this project by ${data.removedBy || 'an admin'}`);
          // You might want to redirect after a timeout
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else {
          // Update local state to remove the collaborator
          setCollaborators(prev => 
            prev.filter(collab => {
              const collabUserId = typeof collab.user === 'object' ? collab.user._id : collab.user;
              const removedUserId = typeof data.userId === 'object' ? data.userId._id : data.userId;
              return collabUserId?.toString() !== removedUserId?.toString();
            })
          );
          
          // Show notification
          setNotificationMsg(`${data.userName || 'A collaborator'} was removed from the project`);
          setTimeout(() => setNotificationMsg(''), 3000);
        }
      }
    };    
    
    if (!socket) return () => {};
    
    // Create a handler for project updates specifically
    const handleProjectUpdate = (data) => {
      if (data.type === 'role_change') {
        handleRoleUpdate(data);
      } else if (data.type === 'collaborator_removed') {
        handleCollaboratorRemoved(data);
      }
    };
    
    // Listen to all role-related events
    socket.on('role_updated', handleRoleUpdate);
    socket.on('collaborator_role_changed', handleRoleUpdate);
    socket.on('your_role', handleRoleUpdate);
    socket.on('project_update', handleProjectUpdate);
    socket.on('collaborator_removed', handleCollaboratorRemoved);

    // Return cleanup function to remove all listeners
    return () => {
      // Safely remove listeners
      try {
        socket.off('role_updated', handleRoleUpdate);
        socket.off('collaborator_role_changed', handleRoleUpdate);
        socket.off('your_role', handleRoleUpdate);
        socket.off('project_update', handleProjectUpdate);
        socket.off('collaborator_removed', handleCollaboratorRemoved);
      } catch (err) {
        console.error('Error cleaning up socket listeners:', err);
      }
    };
  }, [socket, projectId, currentUser]);

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      if (isAdmin) {
        setError(''); // Clear any previous errors
        
        // Show a temporary notification
        setNotificationMsg('Updating collaborator role...');
        
        // API request
        await ProjectService.updateCollaboratorRole(projectId, userId, newRole);
        
        // Update local state immediately for better UX
        setCollaborators(prev => 
          prev.map(collab => {
            // Handle different data formats for collaborators
            const collabUserId = typeof collab.user === 'object' ? collab.user._id : collab.user;
            return collabUserId?.toString() === userId?.toString() 
              ? { ...collab, role: newRole } 
              : collab;
          })
        );
        
        // Emit socket event for real-time update
        if (socket) {
          // Use the WebSocketService to broadcast the role change
          WebSocketService.broadcastRoleChange(
            projectId,
            userId, 
            newRole, 
            currentUser?.name || 'Admin'
          );
          
          // Also emit direct events for immediate local updates
          socket.emit('update_role', {
            projectId,
            userId,
            newRole,
            updatedBy: currentUser?.name || 'Admin',
            timestamp: new Date().toISOString()
          });
          
          // Also broadcast a role_updated event to ensure it's picked up by all components
          socket.emit('role_updated', {
            projectId,
            userId,
            newRole,
            updatedBy: currentUser?.name || 'Admin',
            timestamp: new Date().toISOString()
          });
        }
        
        // Show success notification
        setNotificationMsg(`Collaborator role successfully updated to ${newRole}`);
        setTimeout(() => setNotificationMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update collaborator role. Please try again.');
    }
  };

  // Show remove confirmation dialog
  const showRemoveConfirmationDialog = (collaborator) => {
    setCollaboratorToRemove(collaborator);
    setShowRemoveConfirmation(true);
  };
  
  // Cancel remove action
  const cancelRemove = () => {
    setCollaboratorToRemove(null);
    setShowRemoveConfirmation(false);
  };
  
  // Confirm and execute removal
  const confirmRemoveCollaborator = async () => {
    try {
      if (!collaboratorToRemove || !isAdmin) {
        cancelRemove();
        return;
      }
      
      setError(''); // Clear previous errors
      setNotificationMsg('Removing collaborator...');
      
      // Extract user ID
      const userId = typeof collaboratorToRemove.user === 'object' 
        ? collaboratorToRemove.user._id 
        : collaboratorToRemove.user;
      
      // Extract user name for notification
      const userName = typeof collaboratorToRemove.user === 'object' 
        ? collaboratorToRemove.user.name 
        : 'the collaborator';
      
      // Make API call to remove the collaborator
      await ProjectService.removeCollaborator(projectId, userId);
      
      // Update local state immediately for better UX
      setCollaborators(prev => 
        prev.filter(collab => {
          const collabUserId = typeof collab.user === 'object' ? collab.user._id : collab.user;
          return collabUserId?.toString() !== userId?.toString();
        })
      );
      
      // Emit socket event for real-time update using the WebSocketService
      if (socket) {
        WebSocketService.broadcastCollaboratorRemoval(
          projectId,
          userId,
          userName,
          currentUser?.name || 'Admin'
        );
      }
      
      // Clean up and show success notification
      setNotificationMsg(`${userName} has been removed from the project`);
      setTimeout(() => setNotificationMsg(''), 3000);
      
      // Reset state
      cancelRemove();
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError('Failed to remove collaborator. Please try again.');
      cancelRemove();
    }
  };

  // Role change key is now defined at the top of the component
  // Force re-evaluation when roles change
  useEffect(() => {
    if (notificationMsg && notificationMsg.includes('role has been changed')) {
      try {
        // Safely update roleChangeKey
        setRoleChangeKey(prev => prev + 1);
      } catch (error) {
        console.error("Error updating roleChangeKey:", error);
      }
    }
  }, [notificationMsg]);

  // Find current user's role
  const currentUserRole = React.useMemo(() => {
    if (!currentUser) return 'viewer';
    
    try {
      // Use the new utility function for consistent role determination
      return getUserRole({
        projectId,
        userId: currentUser.id,
        collaborators,
        isProjectOwner: projectDetails?.owner?._id === currentUser?.id || 
                      projectDetails?.owner === currentUser?.id,
        isProjectCreator: localStorage.getItem('project_creator_' + projectId) === 'true',
        parentProvidedRole: parentUserRole
      });
    } catch (error) {
      console.error("Error determining user role:", error);
      return parentUserRole || 'viewer';
    }
  }, [collaborators, currentUser, projectDetails, projectId, roleChangeKey, parentUserRole]);

  // Display name for roles (to show "admin" instead of other labels for project creator)
  const getDisplayRole = (collaborator) => {
    if (!collaborator) return 'viewer';
    if (collaborator.isOwner) return 'admin';
    if (collaborator.role === 'admin') return 'admin';
    return collaborator.role || 'viewer';
  };

  // Get color class for role badges - use the utility function
  const getRoleBadgeClass = (role) => {
    // Use the consistent utility for role badge classes
    return getRoleBadgeClasses(role);
  };

  // Confirmation dialog component
  const RemoveConfirmationDialog = () => {
    if (!showRemoveConfirmation || !collaboratorToRemove) return null;
    
    const userName = typeof collaboratorToRemove.user === 'object' 
      ? collaboratorToRemove.user.name 
      : 'this collaborator';
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Remove Collaborator</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to remove <span className="font-medium">{userName}</span> from this project? 
            They will lose all access to the project.
          </p>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={cancelRemove}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button 
              onClick={confirmRemoveCollaborator}
              className="px-4 py-2 text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 dark:bg-gray-800 py-2 z-10">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Project Collaborators</h3>
        <button 
          onClick={onClose} 
          className="p-2 rounded-md bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center"
          title="Back to editor"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-200 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm text-indigo-600 dark:text-indigo-200">Back to Editor</span>
        </button>
      </div>

      {notificationMsg && (
        <RoleChangeNotification 
          message={notificationMsg}
          role={currentUserRole}
          onClose={() => setNotificationMsg('')}
        />
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {/* Render remove confirmation dialog */}
      <RemoveConfirmationDialog />
      
      {loading ? (
        <div className="flex justify-center">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">          <div className="mb-3 text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Your role: 
            <div className="ml-2">
              <RoleChangeAnimation 
                role={currentUserRole} 
                projectId={projectId} 
                showFullName={true} 
              />
            </div>
          </div>
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 collaborators-panel-scrollable" style={{ maxHeight: 'calc(100% - 50px)' }}>
            {collaborators.filter(collab => {
              if (!collab || !collab.user) return false;
              
              // Filter out the owner if they appear as a regular collaborator as well
              // Check if this is the project creator AND the user also appears elsewhere marked as owner
              const collabUserId = typeof collab.user === 'object' ? collab.user._id : collab.user;
              const ownerUserId = typeof projectDetails?.owner === 'object' ? projectDetails?.owner?._id : projectDetails?.owner;
              const isProjectCreator = collabUserId === ownerUserId;
              
              const alreadyHasOwnerEntry = collaborators.some(c => {
                if (!c || !c.user) return false;
                const cUserId = typeof c.user === 'object' ? c.user._id : c.user;
                return c.isOwner && cUserId === collabUserId && c !== collab;
              });
              
              // Show this entry if it's not a duplicate or if it's the owner entry
              return !isProjectCreator || collab.isOwner || !alreadyHasOwnerEntry;
            }).map((collab, index) => {
              // Extract user properties safely
              const userId = typeof collab.user === 'object' ? collab.user._id : collab.user;
              const userName = typeof collab.user === 'object' ? collab.user.name : 'User';
              const userEmail = typeof collab.user === 'object' ? collab.user.email : '';
              
              return (
                <div 
                  key={userId || `collab-${index}`} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {userName} {collab.isOwner && "(Project Creator)"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userEmail}
                    </div>                    <div className="mt-1">
                      <RoleChangeAnimation 
                        role={getDisplayRole(collab)} 
                        projectId={projectId} 
                        compact={true} 
                      />
                    </div>
                  </div>
                  
                  {isAdmin && !collab.isOwner && userId !== currentUser?.id && (
                    <div className="flex items-center space-x-2">                      <select
                        value={collab.role || 'viewer'}
                        onChange={(e) => handleRoleChange(userId, e.target.value)}
                        className="appearance-none bg-white dark:bg-gray-700 border-2 border-indigo-300 dark:border-indigo-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-32 py-2 pl-3 pr-8 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                      >
                        <option value="viewer">Viewer (Read-only access)</option>
                        <option value="editor">Editor (Can modify code)</option>
                        {/* Admin option is reserved */}
                      </select>
                      <button
                        onClick={() => showRemoveConfirmationDialog(collab)}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Remove collaborator"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {projectDetails && (
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-md border border-indigo-100 dark:border-indigo-800">
          <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Project Details</h4>
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            <div><span className="font-medium">Name:</span> {projectDetails?.name || 'Unnamed Project'}</div>            <div><span className="font-medium">Created by:</span> {
              // First check if the owner object has firstName and lastName
              (typeof projectDetails?.owner === 'object' && 
               (projectDetails.owner?.firstName || projectDetails.owner?.lastName) && 
               `${projectDetails.owner.firstName || ''} ${projectDetails.owner.lastName || ''}`.trim()) ||
              // Then check if owner has a username
              (typeof projectDetails?.owner === 'object' && projectDetails.owner?.username) ||
              // Then check if we have a creator object with a name
              (projectDetails?.creator?.name) ||
              // Only show the current user's name if they are actually the owner
              (projectDetails?.owner && currentUser?.id && 
               ((typeof projectDetails.owner === 'object' && projectDetails.owner?._id === currentUser?.id) || 
                (typeof projectDetails.owner === 'string' && projectDetails.owner === currentUser?.id)) ? 
                `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.username || currentUser?.name : 
              // Fallback to generic name if nothing else is available
              'Project Creator')
            }</div>
            <div><span className="font-medium">Language:</span> {projectDetails?.language || 'javascript'}</div>
            <div>
              <span className="font-medium">Your access:</span>{' '}              <RoleChangeAnimation 
                role={currentUserRole} 
                projectId={projectId} 
                compact={true} 
              />
            </div>
            {/* Dynamic role message that updates with role changes */}
            <div className={`mt-2 ${
              currentUserRole === 'admin' ? 'text-green-600 dark:text-green-400' : 
              currentUserRole === 'editor' ? 'text-blue-600 dark:text-blue-400' :
              'text-amber-600 dark:text-amber-400'
            }`}>
              {currentUserRole === 'admin' && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  You have admin privileges
                </>
              )}
              
              {currentUserRole === 'editor' && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  You have editor privileges
                </>
              )}
              {currentUserRole === 'viewer' && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  You have viewer access
                </>
              )}
            </div>
          </div>
          {/* Close button removed from here as we've added a universal back/close button at the top */}
        </div>
      )}
    </div>
  );
};

export default CollaboratorsPanel;
