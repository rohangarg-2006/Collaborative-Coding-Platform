import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/editor/CodeEditor';
import Layout from '../components/layout/Layout';
import LanguageChangeNotification from '../components/editor/LanguageChangeNotification';
import RecentProjects from '../components/editor/RecentProjects';
import ProjectCreateModal from '../components/editor/ProjectCreateModal';
import ProjectEditModal from '../components/editor/ProjectEditModal';
import EditorChat from '../components/editor/EditorChat';
import UserPresence from '../components/editor/UserPresence';
import UserCursor from '../components/editor/UserCursor';
import ShareProjectModal from '../components/editor/ShareProjectModal';
import CollaboratorsPanel from '../components/editor/CollaboratorsPanel';
import RoleChangeNotification from '../components/editor/RoleChangeNotification';
import CodeOutput from '../components/editor/CodeOutput'; // Import CodeOutput component
import ErrorBoundary from '../components/common/ErrorBoundary'; // Add ErrorBoundary import
import { STARTER_CODE, LANGUAGES } from '../utils/constants';
import '../components/editor/role-indicator.css';
import '../editor-output-layout.css';
import { 
  applyDiagnostics, 
  configureLanguageValidation, 
  forceErrorCheck,
  generateTestErrors,
  downloadCodeAsFile 
} from '../utils/editorUtils';
import {
  handleLanguageTransition,
  clearAllErrorMarkers,
  isLanguageTransitionInProgress,
  startLanguageTransition
} from '../utils/languageTransition';
import AuthService from '../utils/authService';
import { ProjectService, SessionService } from '../utils/projectService';
import WebSocketService from '../utils/websocketService';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { getRoleDisplayName } from '../utils/roleUtils';

const EditorPage = ({ theme, setTheme }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [language, setLanguage] = useState("javascript");
  const [showErrors, setShowErrors] = useState(true);
  const [code, setCode] = useState(STARTER_CODE.javascript || "// Start coding collaboratively!");
  const editorRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(projectId ? true : false);
  const [error, setError] = useState("");
  const [project, setProject] = useState(null);
  const [session, setSession] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursorPositions, setCursorPositions] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('viewer'); // Default role is viewer
  const [isAdmin, setIsAdmin] = useState(false); // Is the current user an admin?
  const [showCollaboratorsPanel, setShowCollaboratorsPanel] = useState(false);
  const [accessNotification, setAccessNotification] = useState('');
  // Initialize with output panel hidden by default
  const [showOutputPanel, setShowOutputPanel] = useState(false);
  
  // Track previous language to detect changes
  const prevLanguageRef = useRef(language);
  // Track code changes for debouncing
  const codeRef = useRef(code);
  // Track if changes need to be synced
  const needsSyncRef = useRef(false);
    // State for project modals  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState('');
  
  // Ref for the editor container - for cursor position calculations
  const editorContainerRef = useRef(null);  // Current user info
  const [currentUser, setCurrentUser] = useState(AuthService.getStoredUser());
    // Get WebSocket context with role updates
  const { 
    socket, 
    roleUpdates, 
    hasProjectPermission, 
    getProjectRole, 
    synchronizeRoles 
  } = useWebSocket();
  
  // Function to send chat message
  const sendChatMessage = (messageContent) => {
    if (!messageContent.trim() || !projectId || !session?._id) return;
    
    WebSocketService.sendChatMessage(projectId, messageContent, session._id);
    setChatInput("");
  };
  
  // Function to get cursor position in viewport coordinates
  const getCursorCoordinates = (position) => {
    if (!editorRef.current || !position) return null;
    
    try {
      // Convert position to viewport coordinates
      const coordinates = editorRef.current.getScrolledVisiblePosition(position);
      
      if (!coordinates) return null;
      
      // Get editor container position for relative positioning
      const containerRect = editorContainerRef.current?.getBoundingClientRect();
      
      if (!containerRect) return coordinates;
      
      // Adjust for container position
      return {
        left: coordinates.left,
        top: coordinates.top + coordinates.height
      };
    } catch (error) {
      console.error("Failed to get cursor coordinates:", error);
      return null;
    }
  };
  
  // Toggle chat panel
  const toggleChatPanel = () => {
    setShowChatPanel(prev => !prev);
  };
  // Force editor to resize when output panel visibility changes
  useEffect(() => {
    if (editorRef.current) {
      // First immediate update
      editorRef.current.layout();
      
      // Additional layout calls during transition for smoothness
      const timers = [100, 200, 300, 400].map(delay => 
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, delay)
      );
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [showOutputPanel]);

  // Function to apply diagnostics to the editor
  const updateDiagnostics = () => {
    if (!window.monaco || !editorRef.current) return;
    
    // Skip diagnostic updates during language transitions to prevent flickering
    if (isLanguageTransitionInProgress()) {
      console.log(`Skipping diagnostics during language transition`);
      return;
    }
    
    console.log(`Updating diagnostics for ${language}, showErrors=${showErrors}`);
    
    // Apply diagnostics using our utility function only if not in transition
    applyDiagnostics(editorRef.current, window.monaco, code, language, showErrors);
    
    // Refresh the editor to ensure error decorations are properly applied
    setTimeout(() => {
      if (editorRef.current) {      // Skip updating UI if we're in the middle of a transition
        if (isLanguageTransitionInProgress()) return;
        
        // Force a render of the editor
        editorRef.current.render();
          // Don't steal focus during language transitions
        if (!isLanguageTransitionInProgress()) {
          editorRef.current.focus();
        }
        
        // Apply language-specific CSS class to ensure proper styling
        const editorDom = editorRef.current.getDomNode();
        if (editorDom) {
          const monacoEditor = editorDom.closest('.monaco-editor');
          if (monacoEditor) {
            // Remove existing language classes
            monacoEditor.classList.forEach(cls => {
              if (cls.startsWith('language-')) {
                monacoEditor.classList.remove(cls);
              }
            });
            // Add current language class
            monacoEditor.classList.add(`language-${language}`);
            
            // Also set a data attribute that CSS can target
            monacoEditor.setAttribute('data-language', language);
            
            // Apply additional classes for error highlighting if needed
            if (showErrors) {
              monacoEditor.classList.add('show-errors');
            } else {
              monacoEditor.classList.remove('show-errors');
            }
          }
        }
        
        // Only check for errors if we're not in a transition
        if (!window._languageTransitionInProgress) {
          // Check if errors were actually applied
          const model = editorRef.current.getModel();
          if (model) {
            const markers = window.monaco.editor.getModelMarkers({
              resource: model.uri
            });
            
            console.log(`Found ${markers.length} markers for language ${language}`);
            
            // If we have markers but they're not showing up, try creating them again
            if (markers.length > 0 && showErrors) {
              setTimeout(() => {
                // Force apply error decorations directly
                applyCustomErrorHighlighting(markers);
              }, 100);
            }
          }
        }
      }
    }, 200);
  };
  // Effect to handle role updates from WebSocketContext
  useEffect(() => {
    if (!projectId || roleUpdates.length === 0) return;
    
    // Get the latest role update for this project
    const latestUpdate = [...roleUpdates]
      .reverse()
      .find(update => update.projectId === projectId);
      
    if (!latestUpdate) return;
    
    console.log('Processing role update in EditorPage:', latestUpdate);
    
    // Check if this update applies to the current user
    const currentUserId = currentUser?.id || currentUser?._id;
    const isForCurrentUser = 
      (latestUpdate.userId?.toString() === currentUserId?.toString()) || 
      (!latestUpdate.userId && !latestUpdate.updatedFor); // Global project update
      
    if (isForCurrentUser) {
      // Check if user is project owner/creator - they must always have admin role
      const isCreator = localStorage.getItem('project_creator_' + projectId) === 'true';
      const isOwner = project && project.owner && 
                     ((typeof project.owner === 'object' && project.owner._id === currentUserId) ||
                      (typeof project.owner === 'string' && project.owner === currentUserId));
      
      // Get the new role from the update
      let newRole = latestUpdate.newRole || latestUpdate.role;
      
      // Enforce admin role for owner/creator regardless of what the server sent
      if (isCreator || isOwner) {
        newRole = 'admin';
        // Store this to ensure consistent admin status
        localStorage.setItem('project_creator_' + projectId, 'true');
      }
      
      if (newRole) {
        console.log(`Updating current user role to ${newRole}`);
        setUserRole(newRole);
        setIsAdmin(newRole === 'admin');
        
        // Save the role to localStorage for persistence
        localStorage.setItem('project_role_' + projectId, newRole);
          // Show detailed notification about the role change
        const updater = latestUpdate.updatedBy || 'the project owner';
        let message = '';
          // Use the imported getRoleDisplayName function for consistent role display names
        
        if (newRole === 'viewer') {
          message = `Your access level has been changed to ${getRoleDisplayName('viewer')} by ${updater}`;
        } else if (newRole === 'editor') { 
          message = `You have been granted ${getRoleDisplayName('editor')} by ${updater}`;
        } else if (newRole === 'admin') {
          message = `You have been granted ${getRoleDisplayName('admin')} by ${updater}`;
        }
        
        setAccessNotification(message);
        
        // Auto-dismiss the notification after 5 seconds
        setTimeout(() => {
          setAccessNotification('');
        }, 5000);
      }
    }
  }, [roleUpdates, projectId, currentUser, project]);
  // Listen for direct role update events
  useEffect(() => {
    if (!projectId) return;
    
    const handleRoleUpdateEvent = (event) => {
      const { projectId: eventProjectId, newRole, timestamp } = event.detail;
      
      if (eventProjectId === projectId && newRole) {
        console.log(`🎯 Direct role update event received: ${newRole} at ${new Date(timestamp).toLocaleTimeString()}`);
        
        // Check if we need to update the current role
        if (newRole !== userRole) {
          setUserRole(newRole);
          setIsAdmin(newRole === 'admin');
          
          // Show a notification about the role change
          setAccessNotification(`Your role has been updated to ${getRoleDisplayName(newRole)}`);
          setTimeout(() => setAccessNotification(''), 5000);
        }
      }
    };
    
    // Listen for role update events
    document.addEventListener('roleUpdated', handleRoleUpdateEvent);
    
    return () => {
      document.removeEventListener('roleUpdated', handleRoleUpdateEvent);
    };
  }, [projectId, userRole]);
  
  // Effect to load project if projectId is provided
  useEffect(() => {
    if (!projectId) return;
    
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const projectData = await ProjectService.getProject(projectId);
        if (projectData) {
          setProject(projectData);
          setCode(projectData.code || STARTER_CODE[projectData.language] || "");
          setLanguage(projectData.language || "javascript");
          
          // Need to handle both populated owner objects and string IDs
          const currentUserId = currentUser?.id || currentUser?._id;
          
          // Check if user is the project owner (comparing IDs as strings to avoid type issues)
          let isOwner = false;
          let isProjectCreator = localStorage.getItem('project_creator_' + projectId) === 'true';
          // Also check if there's a stored role for this project
          let storedRole = localStorage.getItem('project_role_' + projectId);
          
          if (typeof projectData.owner === 'object' && projectData.owner !== null) {
            // Owner is populated as an object
            const ownerId = projectData.owner._id || projectData.owner.id;
            isOwner = ownerId?.toString() === currentUserId?.toString();
          } else {
            // Owner is just an ID
            isOwner = projectData.owner?.toString() === currentUserId?.toString();
          }
            
        // If user is the owner, always mark them as creator with admin role in localStorage
          if (isOwner) {
            localStorage.setItem('project_creator_' + projectId, 'true');
            localStorage.setItem('project_role_' + projectId, 'admin');
            isProjectCreator = true;
            storedRole = 'admin';
            setIsAdmin(true);
            setUserRole('admin');
          }
            
          console.log('Project owner check:', { 
            owner: typeof projectData.owner === 'object' ? projectData.owner._id : projectData.owner, 
            currentUser: currentUserId, 
            isOwner,
            isProjectCreator,
            storedRole
          });
          
          // Check if this user is the creator and ensure they have admin role
          // This will also enforce the role on the server side via WebSocket
          const isCreatorWithAdminRole = ProjectService.ensureCreatorHasAdminRole(projectData);
          
          // Set admin status if user is owner OR if they just created this project OR if their stored role is admin
          const shouldBeAdmin = isOwner || isProjectCreator || storedRole === 'admin';
          setIsAdmin(shouldBeAdmin);
          if (shouldBeAdmin) {
            setUserRole('admin');
            
            // If this user should be admin, ensure it's enforced on the server side too
            setTimeout(() => {
              WebSocketService.enforceAdminStatus(projectId, currentUserId);
            }, 500);
            
            // Also check for correct collaborator entry
            const collaboratorEntry = projectData.collaborators?.find(
              c => typeof c.user === 'object' 
                ? c.user._id?.toString() === currentUserId?.toString()
                : c.user?.toString() === currentUserId?.toString()
            );
            
            // Double verify with stronger enforcement for owners
            if (isOwner && (!collaboratorEntry || collaboratorEntry.role !== 'admin')) {
              console.log('Owner found but without proper admin role in collaborators, forcing update');
              setTimeout(() => {
                WebSocketService.enforceAdminStatus(projectId, currentUserId);
              }, 1000);
            }
          } else {
            // Check collaborator list for this user's role
            const collaborator = projectData.collaborators?.find(
              c => typeof c.user === 'object' 
                ? c.user._id?.toString() === currentUserId?.toString()
                : c.user?.toString() === currentUserId?.toString()
            );
            
            if (collaborator) {
              setUserRole(collaborator.role);
              console.log('Setting role from collaborator:', collaborator.role);
            } else {
              setUserRole('viewer'); // Default for new joiners
              console.log('Setting default viewer role');
            }          }
          
          // Create or join session
          const sessionData = await SessionService.createSession(projectId);
          setSession(sessionData);
          
          // Get chat messages if available
          if (sessionData._id) {
            const messages = await SessionService.getChatMessages(sessionData._id);
            if (messages) {
              setChatMessages(messages);
            }
          }
          
          // Fetch collaborator info for displaying in the panel
          try {
            const collaborators = await ProjectService.getProjectCollaborators(projectId);
            // We'll use this data in the CollaboratorsPanel component
          } catch (err) {
            console.error("Failed to load collaborators:", err);
          }
        }
      } catch (error) {
        console.error("Failed to load project:", error);
        setError("Failed to load project. You might not have permission to access it.");
      } finally {
        setIsLoading(false);
      }
    };
      loadProject();
  }, [projectId]);
  
  // Effect to setup WebSocket connection
  useEffect(() => {
    if (!projectId || !project) return;
    
    // Use direct WebSocketService instead of context for now
    // Connect to WebSocket
    const socket = WebSocketService.connect();
    
    // Join the project room
    WebSocketService.joinProject(projectId, session?._id);
        // Listen for role assignment from server
    const roleAssignmentListener = WebSocketService.onYourRoleAssigned((data) => {
      if (data.projectId === projectId) {
        console.log('Server assigned role:', data.role);
        
        // The server determines if this user is the owner and assigns the appropriate role
        // Check if this user is the creator/owner first (strongly enforced)
        const isCreator = localStorage.getItem('project_creator_' + projectId) === 'true';
        const currentUserId = AuthService.getStoredUser()?.id;
        
        // Verify if user is the owner by checking project data
        let isOwner = false;
        if (project && currentUserId) {
          const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
          isOwner = ownerId?.toString() === currentUserId?.toString();
          
          // If user is the owner but not marked as creator, mark them as creator
          if (isOwner && !isCreator) {
            localStorage.setItem('project_creator_' + projectId, 'true');
            console.log('Marking user as project creator based on owner match');
          }
        }
          // If this user is creator/owner, they should ALWAYS be admin regardless of server role
        // This is the CRITICAL fix to ensure project creators always have admin access
        if (isCreator || isOwner) {
          setIsAdmin(true);
          setUserRole('admin');
          localStorage.setItem('project_creator_' + projectId, 'true');
          localStorage.setItem('project_role_' + projectId, 'admin');
          
          // If server didn't send admin role, enforce it strongly
          if (data.role !== 'admin') {
            console.log('Project creator/owner received non-admin role, enforcing admin status');
            // Try multiple times to overcome any race conditions
            WebSocketService.enforceAdminStatus(projectId, currentUserId);
            setTimeout(() => {
              WebSocketService.enforceAdminStatus(projectId, currentUserId);
            }, 500);
          }
        } else {
          // Not creator/owner - apply role from server
          if (data.role === 'admin') {
            setIsAdmin(true);
            setUserRole('admin');
            localStorage.setItem('project_role_' + projectId, 'admin');
            console.log('Setting admin role from server-side verification');
          } else {
            // Only update if we're not already admin (admin role takes precedence)
            if (userRole !== 'admin' && !isAdmin) {
              setUserRole(data.role);
              // If not admin, make sure isAdmin flag is false
              if (data.role !== 'admin') {
                setIsAdmin(false);
              }
            }
          }
        }
      }
    });
      
    // Set up event listeners
    const codeUpdateListener = WebSocketService.onCodeUpdate((data) => {
      if (data.code && data.user.id !== AuthService.getStoredUser()?.id) {
        setCode(data.code);
        codeRef.current = data.code;
      }
    });
    
    const cursorUpdateListener = WebSocketService.onCursorUpdate((data) => {
      setCursorPositions(prev => ({
        ...prev,
        [data.user.id]: {
          position: data.cursorPosition,
          user: data.user
        }
      }));
    });
    
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
      setCursorPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[data.user.id];
        return newPositions;
      });
    });
    
    const chatMessageListener = WebSocketService.onChatMessage((data) => {
      setChatMessages(prev => [...prev, data.message]);
    });
      return () => {
      // Clean up event listeners and leave project room
      codeUpdateListener();
      cursorUpdateListener();
      userJoinedListener();
      userLeftListener();
      chatMessageListener();
      roleAssignmentListener();
      
      if (projectId) {
        WebSocketService.leaveProject(projectId, session?._id);
      }
      
      WebSocketService.disconnect();
    };
  }, [projectId, project, session]);
  // Listen for access mode changes via WebSocket
  useEffect(() => {
    if (!socket) return;
    
    const handleRoleUpdate = (data) => {
      if (data.projectId === projectId) {
        console.log('Role update received from server:', data);
        
        // Extract role from either role or newRole property for consistency
        const roleValue = data.newRole || data.role;
        
        // Check if this update is for the current user
        const currentUserId = AuthService.getStoredUser()?.id;
        const isForCurrentUser = !data.userId || 
                                data.userId === currentUserId || 
                                data.userId?.toString() === currentUserId?.toString();
        
        if (isForCurrentUser) {
          console.log('Role update is for current user:', roleValue);
          
          // Update the user role state immediately 
          setUserRole(roleValue);
          
          // Persist role in localStorage for consistency
          localStorage.setItem('project_role_' + projectId, roleValue);
          
          // If the new role is admin, make sure to set isAdmin flag too
          if (roleValue === 'admin') {
            setIsAdmin(true);
            console.log('Setting isAdmin to true based on role update');
          } else {
            // Only set isAdmin to false if we're explicitly getting a non-admin role
            // and this isn't the project owner
            if (!project || project.owner?._id !== currentUserId) {
              setIsAdmin(false);
            }
          }
            // Create a more descriptive notification message based on role
          let message = '';
          const updater = data.updatedBy || 'the project owner';
            // Use the imported getRoleDisplayName function to get consistent role display names
          
          if (roleValue === 'viewer') {
            message = `Your access level has been changed to ${getRoleDisplayName('viewer')} by ${updater}`;
          } else if (roleValue === 'editor') { 
            message = `You have been granted ${getRoleDisplayName('editor')} by ${updater}`;
          } else if (roleValue === 'admin') {
            message = `You have been granted ${getRoleDisplayName('admin')} by ${updater}`;
          }
          
          setAccessNotification(message);
          
          // Auto-hide notification after 8 seconds (increased for better visibility)
          setTimeout(() => {
            setAccessNotification('');
          }, 8000);
        }
      }
    };
    
    // Listen to all role-related events
    socket.on('role_updated', handleRoleUpdate);
    socket.on('collaborator_role_changed', handleRoleUpdate);
    socket.on('your_role', handleRoleUpdate);
    
    return () => {
      socket.off('role_updated', handleRoleUpdate);
      socket.off('collaborator_role_changed', handleRoleUpdate);
      socket.off('your_role', handleRoleUpdate);
    };
  }, [socket, projectId, project]);
  
  // Function to save code changes
  const saveCodeChanges = async () => {
    if (!projectId || !project) return;
    
    try {
      setIsLoading(true);
      await ProjectService.updateProjectCode(projectId, code, project.version + 1);
      setShowUnsavedChanges(false);
      needsSyncRef.current = false;
    } catch (error) {
      console.error("Error saving code:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Debounced sync function for real-time collaboration
  useEffect(() => {
    if (!projectId || !project) return;
    
    // Update code ref to track latest value
    codeRef.current = code;
    
    // Mark that we have unsaved changes
    if (!isLoading) {
      setShowUnsavedChanges(true);
      needsSyncRef.current = true;
    }      // Send code changes to server via WebSocket
    const syncCode = () => {
      if (needsSyncRef.current && projectId) {
        WebSocketService.sendCodeChanges(
          projectId,
          codeRef.current,
          editorRef.current?.getPosition() // Get cursor position
        );
        needsSyncRef.current = false;
      }
    };
    
    // Sync immediately for real-time experience
    syncCode();
    
    // Also debounce full saves to the database
    const saveDebounceTimer = setTimeout(() => {
      if (showUnsavedChanges) {
        saveCodeChanges();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity
    
    return () => {
      clearTimeout(saveDebounceTimer);
    };
  }, [code]);
  // Function to send cursor position updates
  const handleCursorPositionChange = (position) => {
    if (!projectId || !project) return;
    
    WebSocketService.sendCursorPosition(projectId, position);
  };  // Function to send chat messages  
  const handleChatSubmit = (e) => {
    e.preventDefault();
    
    if (!chatInput.trim() || !projectId || !session?._id) return;
    
    WebSocketService.sendChatMessage(projectId, chatInput, session._id);
    setChatInput("");
  };  // Function to create a new project
  const createNewProject = async (name, description, isPublic = false, selectedLanguage = language) => {
    try {
      setIsLoading(true);
      const newProject = await ProjectService.createProject({
        name,
        description,
        language: selectedLanguage,
        code,
        isPublic
      });
        // Set the project data before navigation
      setProject(newProject);
      
      // Set the language if it's different
      if (selectedLanguage !== language) {
        setLanguage(selectedLanguage);
      }
        // Since the current user is creating the project, they should be the owner/admin
      // This is CRITICAL - ensure creator always gets admin access
      setIsAdmin(true);
      setUserRole('admin');
      console.log('Project created - setting current user as admin');
      
      // Create a session for this project
      const sessionData = await SessionService.createSession(newProject._id);
      setSession(sessionData);
        
      // Store admin state in local storage before navigation
      // This ensures the admin state persists during navigation
      localStorage.setItem('project_creator_' + newProject._id, 'true');
      localStorage.setItem('project_role_' + newProject._id, 'admin');
      
      // Extra check to verify admin role in collaborators
      const currentUserId = AuthService.getStoredUser()?.id;
      if (currentUserId && newProject.collaborators) {
        const creatorCollaborator = newProject.collaborators.find(
          c => (typeof c.user === 'string' && c.user === currentUserId) || 
              (typeof c.user === 'object' && c.user?._id === currentUserId)
        );
        
        if (!creatorCollaborator || creatorCollaborator.role !== 'admin') {
          console.log('Enforcing admin role for project creator via WebSocket');
          WebSocketService.enforceAdminStatus(newProject._id, currentUserId);
        }
      }
      
      // Explicitly enforce admin status after a short delay
      setTimeout(() => {
        const currentUserId = AuthService.getStoredUser()?.id;
        if (currentUserId) {
          WebSocketService.enforceAdminStatus(newProject._id, currentUserId);
        }
      }, 300);
      
      // Create a small delay to ensure all state is properly set
      // before navigation, as navigation can interrupt state updates
      setTimeout(() => {
        // Navigate to the new project
        navigate(`/editor/${newProject._id}`);
      }, 500);
    } catch (error) {
      console.error("Error creating project:", error);
      setError("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle project updates
  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
    
    // If language has changed, update the editor
    if (updatedProject.language !== language) {
      setLanguage(updatedProject.language);
    }
    
    // Notify all connected users about project update via WebSocket
    if (projectId && socket) {
      socket.emit('project_updated', {
        projectId,
        project: updatedProject
      });
    }
    
    // Close the edit modal
    setIsEditModalOpen(false);
  };
  
  // Update editor language and starter code when language changes
  useEffect(() => {
    // Check if language has changed
    const languageChanged = prevLanguageRef.current !== language;
    
    if (editorRef.current && window.monaco && languageChanged) {
      console.log(`Language changing from ${prevLanguageRef.current} to ${language}`);
      
      // Use our utility function to handle language transition
      handleLanguageTransition(
        editorRef.current, 
        window.monaco, 
        language, 
        prevLanguageRef.current,
        STARTER_CODE,
        setCode
      );
      
      // Update the ref to track this language as the previous one for next change
      prevLanguageRef.current = language;
      
      // Configure language specific settings after transition starts
      const model = editorRef.current.getModel();
      if (model) {
        // Configure validation settings
        configureLanguageValidation(window.monaco, language, showErrors);
        
        // Apply language-specific CSS class
        const editorDom = editorRef.current.getDomNode();
        if (editorDom) {
          const monacoEditor = editorDom.closest('.monaco-editor');
          if (monacoEditor) {
            // Clear previous language classes
            monacoEditor.classList.forEach(cls => {
              if (cls.startsWith('language-')) {
                monacoEditor.classList.remove(cls);
              }
            });
            
            // Add new language class
            monacoEditor.classList.add(`language-${language}`);
            monacoEditor.setAttribute('data-language', language);
            
            if (showErrors) {
              monacoEditor.classList.add('show-errors');
            } else {
              monacoEditor.classList.remove('show-errors');
            }
          }
        }
        
        // Run error detection after a delay to ensure the model has updated and transition is complete
        setTimeout(() => {
          // Only update diagnostics if the transition has completed
          if (!isLanguageTransitionInProgress()) {
            updateDiagnostics();
            
            // For languages that don't have built-in diagnostics (like C++), force error checking
            if (language !== 'javascript' && language !== 'typescript') {
              forceErrorCheck(editorRef.current, window.monaco, code, language);
            }
          }
        }, 800);
      }
    }
  }, [language, showErrors, code]);
  
  // Watch for error display preference changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);  
  // Run error detection when code changes
  useEffect(() => {
    // Use debouncing to avoid running error detection too frequently
    const detectErrorsTimeout = setTimeout(() => {
      updateDiagnostics();
    }, 500);
    
    return () => clearTimeout(detectErrorsTimeout);
  }, [code, language, showErrors]);
  
  // Update error detection whenever code changes
  useEffect(() => {
    // Use a debounced update for better performance
    const timer = setTimeout(() => {
      if (editorRef.current && window.monaco) {
        updateDiagnostics();
      }
    }, 500); // Delay to avoid constant updates while typing
    
    return () => clearTimeout(timer);
  }, [code]); // Only run when code content changes

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    
    // Set window.monaco for global access
    window.monaco = monacoInstance;
    
    // Apply role-based access control
    if (userRole === 'viewer') {
      editor.updateOptions({ readOnly: true });
      console.log("Editor is in read-only mode due to viewer role");
    } else {
      editor.updateOptions({ readOnly: false });
    }
    
    // Apply language-specific CSS class to enable proper styling
    const editorDom = editor.getDomNode();
    if (editorDom) {
      const monacoEditor = editorDom.closest('.monaco-editor');
      if (monacoEditor) {
        monacoEditor.classList.add(`language-${language}`);
        
        // Add visual indicator for read-only mode
        if (userRole === 'viewer') {
          monacoEditor.classList.add('read-only-editor');
        } else {
          monacoEditor.classList.remove('read-only-editor');
        }
      }
    }
    
    // Configure TypeScript/JavaScript for better error highlighting and suggestions
    if (monacoInstance.languages.typescript) {
      // Enhance JavaScript configuration
      const jsDefaults = monacoInstance.languages.typescript.javascriptDefaults;
      jsDefaults.setDiagnosticsOptions({
        noSemanticValidation: false, // Always enable for detection
        noSyntaxValidation: false,   // Always enable for detection
        diagnosticCodesToIgnore: [],
      });
      
      jsDefaults.setCompilerOptions({
        target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: true // Always enable for detection
      });
      
      // Add more libraries to improve IntelliSense
      jsDefaults.addExtraLib(`
        declare class Console {
          log(...data: any[]): void;
          info(...data: any[]): void;
          warn(...data: any[]): void;
          error(...data: any[]): void;
          debug(...data: any[]): void;
          table(tabularData: any, properties?: ReadonlyArray<string>): void;
          trace(...data: any[]): void;
          dir(item: any, options?: any): void;
          time(label: string): void;
          timeEnd(label: string): void;
        }
        declare const console: Console;
        
        declare interface Array<T> {
          map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
          filter(predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];
          reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
          forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
          find(predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T | undefined;
          findIndex(predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): number;
          includes(searchElement: T, fromIndex?: number): boolean;
          join(separator?: string): string;
          slice(start?: number, end?: number): T[];
          splice(start: number, deleteCount?: number, ...items: T[]): T[];
          sort(compareFn?: (a: T, b: T) => number): this;
        }

        declare interface Document {
          querySelector(selectors: string): Element | null;
          querySelectorAll(selectors: string): NodeListOf<Element>;
          getElementById(elementId: string): HTMLElement | null;
          createElement(tagName: string): HTMLElement;
        }

        declare interface Math {
          abs(x: number): number;
          max(...values: number[]): number;
          min(...values: number[]): number;
          random(): number;
          round(x: number): number;
        }

        declare interface JSON {
          parse(text: string): any;
          stringify(value: any): string;
        }

        declare class Promise<T> {
          constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void);
          then<TResult>(onFulfilled?: (value: T) => TResult | PromiseLike<TResult>): Promise<TResult>;
          catch<TResult>(onRejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<T | TResult>;
          finally(onFinally?: () => void): Promise<T>;
          static resolve<T>(value: T | PromiseLike<T>): Promise<T>;
          static reject(reason?: any): Promise<never>;
          static all<T>(values: Iterable<T | PromiseLike<T>>): Promise<T[]>;
        }
      `, 'global.d.ts');
      
      // Enhanced TypeScript configuration
      const tsDefaults = monacoInstance.languages.typescript.typescriptDefaults;
      tsDefaults.setDiagnosticsOptions({
        noSemanticValidation: false, // Always enable for detection
        noSyntaxValidation: false,   // Always enable for detection
        diagnosticCodesToIgnore: [],
      });
      
      // Add compiler options for better feature support
      tsDefaults.setCompilerOptions({
        target: monacoInstance.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monacoInstance.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        typeRoots: ["node_modules/@types"],
        jsx: monacoInstance.languages.typescript.JsxEmit.React,
        allowJs: true,
        strict: false,
      });
    }
      // Set up error decorations to visually highlight errors
    const setupErrorDecorations = () => {
      if (!monacoInstance || !editor) return;
      
      // Create decoration types for errors and warnings
      const errorDecorationType = monacoInstance.editor.createDecorationType({
        isWholeLine: true,
        className: 'error-highlight',
        glyphMarginClassName: 'glyph-margin-error',
        overviewRulerColor: 'red',
        overviewRulerLane: monacoInstance.editor.OverviewRulerLane.Right
      });
      
      const warningDecorationType = monacoInstance.editor.createDecorationType({
        isWholeLine: false,
        className: 'warning-highlight',
        glyphMarginClassName: 'glyph-margin-warning',
        overviewRulerColor: '#FFCC00',
        overviewRulerLane: monacoInstance.editor.OverviewRulerLane.Right
      });
      
      // Register a content change listener to update error decorations
      const model = editor.getModel();
      if (model) {
        model.onDidChangeContent(() => {
          setTimeout(() => {
            // Get current markers for this model
            const currentMarkers = monacoInstance.editor.getModelMarkers({
              resource: model.uri
            });
            
            if (!currentMarkers || !currentMarkers.length || !showErrors) {
              return;
            }
            
            // Create decorations from markers
            const errorDecorations = [];
            const warningDecorations = [];
            
            currentMarkers.forEach(marker => {
              const decoration = {
                range: marker.range || new monacoInstance.Range(
                  marker.startLineNumber, 
                  marker.startColumn, 
                  marker.endLineNumber, 
                  marker.endColumn
                ),
                options: {
                  hoverMessage: { value: marker.message }
                }
              };
              
              if (marker.severity === monacoInstance.MarkerSeverity.Error) {
                errorDecorations.push(decoration);
              } else if (marker.severity === monacoInstance.MarkerSeverity.Warning) {
                warningDecorations.push(decoration);
              }
            });
            
            // Apply decorations
            if (errorDecorations.length > 0) {
              editor.setDecorations(errorDecorationType, errorDecorations);
            }
            
            if (warningDecorations.length > 0) {
              editor.setDecorations(warningDecorationType, warningDecorations);
            }
          }, 300);
        });
      }
    };
    
    // Set up language-specific validation and features for all languages
    const setupLanguageFeatures = () => {
      try {
        // Apply error decorations first
        setupErrorDecorations();
        
        // Setup providers for each supported language
        const languageProviders = {
          'python': [
            {
              label: 'print',
              kind: monacoInstance.languages.CompletionItemKind.Function,
              insertText: 'print(${1:value})',
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Print the given object to the standard output',
            },
            {
              label: 'if',
              kind: monacoInstance.languages.CompletionItemKind.Snippet,
              insertText: 'if ${1:condition}:\n\t${2:pass}',
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'If statement',
            },
            {
              label: 'for',
              kind: monacoInstance.languages.CompletionItemKind.Snippet,
              insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'For loop',
            }
          ],
          'cpp': [
            {
              label: 'cout',
              kind: monacoInstance.languages.CompletionItemKind.Function,
              insertText: 'std::cout << ${1:value} << std::endl;',
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Output a value to standard output',
            },
            {
              label: 'for',
              kind: monacoInstance.languages.CompletionItemKind.Snippet,
              insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++) {\n\t${3}\n}',
              insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'For loop',
            }
          ]
        };
        
        // Register completion providers for all languages
        Object.entries(languageProviders).forEach(([lang, suggestions]) => {
          if (monacoInstance.languages.registerCompletionItemProvider) {
            monacoInstance.languages.registerCompletionItemProvider(lang, {
              provideCompletionItems: (model, position) => {
                return { suggestions };
              }
            });
          }
        });
        
        // Register markers provider for all languages to highlight errors
        Object.keys(LANGUAGES).forEach(lang => {
          const model = monacoInstance.editor.getModel();
          if (model && model.getLanguageId() === lang) {
            // Force error detection by triggering model change event
            setTimeout(() => {
              if (model && model.isAttachedToEditor()) {
                // Create and undo a small edit to trigger validation
                const lastLine = model.getLineCount();
                const lastCol = model.getLineMaxColumn(lastLine);
                model.pushEditOperations(
                  [], 
                  [{ range: new monacoInstance.Range(lastLine, lastCol, lastLine, lastCol), text: ' ' }],
                  () => null
                );
                setTimeout(() => model.pushEditOperations(
                  [],
                  [{ range: new monacoInstance.Range(lastLine, lastCol + 1, lastLine, lastCol + 1), text: '' }],
                  () => null
                ), 0);
              }
            }, 100);
          }
        });
      } catch (err) {
        console.error('Error setting up language features:', err);
      }
    };
    
    setupLanguageFeatures();
    
    // Update language model for the current editor
    const model = editor.getModel();
    if (model) {
      monacoInstance.editor.setModelLanguage(model, language);
      
      // Apply syntax highlighting and validation immediately
      editor.updateOptions({
        renderValidationDecorations: showErrors ? "on" : "off",
        glyphMargin: showErrors,
        lightbulb: { enabled: true },
        parameterHints: { enabled: true },
        inlineSuggest: { enabled: true },
        snippetSuggestions: 'inline',
      });
    }
  };  // Update error visibility when showErrors changes
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      
      // Update editor options for visibility of errors
      editor.updateOptions({
        renderValidationDecorations: showErrors ? "on" : "off",
        glyphMargin: showErrors,
        lightbulb: { enabled: showErrors },
      });
      
      // Configure language services based on showErrors setting
      if (window.monaco) {
        // Configure language services
        configureLanguageValidation(window.monaco, language, showErrors);
        
        // Update custom diagnostics
        updateDiagnostics();
        
        const model = editor.getModel();
        if (model) {
          try {
            // If errors should be hidden, clear all markers
            if (!showErrors) {
              // Clear all markers but keep diagnostics running in the background
              window.monaco.editor.setModelMarkers(model, 'custom-diagnostics', []);
              
              // Add custom decorations to hide any remaining built-in markers
              const decorations = [];
              const currentMarkers = window.monaco.editor.getModelMarkers({
                resource: model.uri
              });
              
              if (currentMarkers && currentMarkers.length > 0) {
                // Create decorations that hide existing markers
                const hideDecorations = currentMarkers.map(marker => ({
                  range: marker.range,
                  options: {
                    inlineClassName: 'hidden',
                    className: 'error-highlight-hidden',
                    glyphMarginClassName: 'hidden',
                    isWholeLine: false,
                    overviewRuler: { color: 'transparent', position: 1 }
                  }
                }));
                
                if (hideDecorations.length > 0) {
                  editor.createDecorationsCollection(hideDecorations);
                }
              }
            } else {
              // If errors should be shown, run diagnostics and create visible decorations
              // First trigger a model change to refresh markers
              const lastLine = model.getLineCount();
              const lastLineLength = model.getLineMaxColumn(lastLine);
              
              // Small edit to trigger validation refresh
              model.pushEditOperations(
                [], 
                [{ 
                  range: new window.monaco.Range(lastLine, lastLineLength, lastLine, lastLineLength), 
                  text: ' ' 
                }], 
                () => null
              );
              
              setTimeout(() => {
                model.pushEditOperations(
                  [], 
                  [{ 
                    range: new window.monaco.Range(lastLine, lastLineLength + 1, lastLine, lastLineLength + 1), 
                    text: '' 
                  }], 
                  () => null
                );
                
                // After change, highlight any errors
                setTimeout(() => {
                  const currentMarkers = window.monaco.editor.getModelMarkers({
                    resource: model.uri
                  });
                  
                  // Create decorations for visible errors
                  if (currentMarkers && currentMarkers.length > 0) {
                    const errorDecorations = currentMarkers
                      .filter(marker => marker.severity === window.monaco.MarkerSeverity.Error)
                      .map(marker => ({
                        range: marker.range,
                        options: {
                          isWholeLine: true,
                          className: 'error-highlight',
                          glyphMarginClassName: 'glyph-margin-error',
                          hoverMessage: { value: marker.message },
                          inlineClassName: 'inline-error-highlight',
                          overviewRuler: { color: 'red', position: 1 }
                        }
                      }));
                    
                    const warningDecorations = currentMarkers
                      .filter(marker => marker.severity === window.monaco.MarkerSeverity.Warning)
                      .map(marker => ({
                        range: marker.range,
                        options: {
                          isWholeLine: false,
                          className: 'warning-highlight',
                          glyphMarginClassName: 'glyph-margin-warning',
                          hoverMessage: { value: marker.message },
                          inlineClassName: 'inline-warning-highlight',
                          overviewRuler: { color: 'yellow', position: 1 }
                        }
                      }));
                    
                    const allDecorations = [...errorDecorations, ...warningDecorations];
                    if (allDecorations.length > 0) {
                      editor.createDecorationsCollection(allDecorations);
                    }
                  }
                }, 100);
              }, 50);
            }
          } catch (err) {
            console.error("Error updating error markers:", err);
          }
        }
      }
    }
  }, [showErrors]);  // Update editor's read-only state when user role changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    console.log('Role changed effect: Current role =', userRole, 'isAdmin =', isAdmin, 'project owner =', 
      project ? (typeof project.owner === 'object' ? project.owner._id : project.owner) : 'no project',
      'current user =', AuthService.getStoredUser()?.id);
      
    // Apply read-only mode based on role, but with additional safety checks
    // Double-check if this is actually the project owner or creator
    const currentUserId = AuthService.getStoredUser()?.id;
    const isProjectOwner = project && 
      ((typeof project.owner === 'object' && project.owner?._id === currentUserId) || 
       (typeof project.owner === 'string' && project.owner === currentUserId));
    const isProjectCreator = localStorage.getItem('project_creator_' + project?._id) === 'true';
    
    // CRITICAL FIX: If user is project owner/creator but showing as viewer, force admin role
    if (isProjectOwner || isProjectCreator) {
      if (userRole !== 'admin' || !isAdmin) {
        console.log('Force updating project creator/owner to admin role');
        setUserRole('admin');
        setIsAdmin(true);
        // No need to continue with viewer mode check
        return;
      }
    }
    
    // Project creators/owners should never be in view-only mode regardless of role
    if (userRole === 'viewer' && !isProjectOwner && !isAdmin) {
      console.log('Setting editor to read-only: user is viewer, not owner, not admin');
      editorRef.current.updateOptions({ readOnly: true });
      
      // Add visual indicator for read-only mode
      const editorDom = editorRef.current.getDomNode();
      if (editorDom) {
        const monacoEditor = editorDom.closest('.monaco-editor');
        if (monacoEditor) {
          monacoEditor.classList.add('read-only-editor');
        }
      }
      
      // Show notification
      if (project) {
        setAccessNotification(`You are in view-only mode for project "${project.name}"`);
        setTimeout(() => setAccessNotification(''), 5000);
      }
    } else {
      editorRef.current.updateOptions({ readOnly: false });
      
      // Remove visual indicator
      const editorDom = editorRef.current.getDomNode();
      if (editorDom) {
        const monacoEditor = editorDom.closest('.monaco-editor');
        if (monacoEditor) {
          monacoEditor.classList.remove('read-only-editor');
        }
      }
      
      // Show appropriate notification based on role
      if (project) {
        if (isAdmin) {
          setAccessNotification(`You have admin access to project "${project.name}"`);
        } else {
          setAccessNotification(`You now have edit permissions for project "${project.name}"`);
        }
        setTimeout(() => setAccessNotification(''), 5000);
      }
    }
  }, [userRole, project, isAdmin]);

  // Handle the download button click
  const handleDownload = () => {
    // Get extension for current language
    const extensionMap = {
      javascript: 'js',
      typescript: 'ts',
      html: 'html',
      css: 'css',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      go: 'go',
      ruby: 'rb',
      rust: 'rs',
      php: 'php',
      // Add other languages as needed
    };
    const extension = extensionMap[language] || 'txt';
    
    // Set default filename
    let defaultName = '';
    if (project?.name) {
      defaultName = project.name;
    } else {
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      defaultName = `code_${dateStr}`;
    }
    
    setDownloadFileName(defaultName);
    setShowDownloadDialog(true);
  };

  // Handle the actual download after user confirms filename
  const confirmDownload = () => {
    // Sanitize filename and add extension if needed
    let finalName = downloadFileName.trim();
    
    // Get extension
    const extensionMap = {
      javascript: 'js',
      typescript: 'ts',
      html: 'html',
      css: 'css',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      go: 'go',
      ruby: 'rb',
      rust: 'rs',
      php: 'php',
      // Add other languages as needed
    };
    const extension = extensionMap[language] || 'txt';
    
    // Check if filename already has the extension
    if (!finalName.endsWith(`.${extension}`)) {
      finalName += `.${extension}`;
    }
    
    // Use the utility function to download
    downloadCodeAsFile(code, language, finalName.replace(/\..*$/, ''));
    
    // Close the dialog
    setShowDownloadDialog(false);
  };

  return (
    <>
      <Layout 
        theme={theme} 
        setTheme={setTheme} 
        language={language} 
        setLanguage={setLanguage}
        showErrors={showErrors} 
        setShowErrors={setShowErrors}
        languages={LANGUAGES}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        {/* Display role change notification when access level changes */}
        {accessNotification && (
          <RoleChangeNotification 
            message={accessNotification}
            role={userRole}
            onClose={() => setAccessNotification('')}
          />
        )}
        <div className="editor-container p-4 md:p-6 w-full h-full flex flex-col">
          <div className="editor-header flex items-center mb-2 px-4 py-2 bg-indigo-50 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>            {/* Removed the duplicate access indicators that were on the left side */}
            <div className="ml-4"></div>            <div className="flex-grow flex items-center justify-center">
              <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium">
                {project?.name || `${language.charAt(0).toUpperCase() + language.slice(1)} Editor`}
              </div>
              {isAdmin && project && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="ml-2 p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                  title="Edit project settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}            </div>            {/* Download button for when no project is loaded */}
            {!project && (
              <div className="flex items-center">
                <button 
                  onClick={handleDownload}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded flex items-center transition"
                  title={`Download code as .${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </button>
              </div>
            )}
            {project && (<div className="flex items-center space-x-2">                {/* Download code button */}
                <button 
                  onClick={handleDownload}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded flex items-center transition"
                  title={`Download as ${project?.name || 'code'}.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </button>
                {/* Only show the Share button for public projects */}
                {project.isPublic !== false && (
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded flex items-center transition"
                    title="Share Project"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Share
                  </button>
                )}
                {/* Display private indicator if the project is private */}
                {project.isPublic === false && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Private
                  </span>
                )}
                
                <button 
                  onClick={() => setShowCollaboratorsPanel(!showCollaboratorsPanel)}
                  className={`px-2 py-1 ${
                    isAdmin 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white text-xs rounded flex items-center transition`}
                  title={isAdmin ? "Manage Collaborators" : "View Collaborators"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  {isAdmin ? "Manage Access" : "Collaborators"}                </button>                  
                {/* Unified role indicator badge - consistent style with icons for all roles */}
                <span className={`${
                  userRole === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                  userRole === 'editor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                } text-xs px-2 py-1 rounded-full flex items-center`}>
                  {userRole === 'viewer' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {userRole === 'editor' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  )}
                  {userRole === 'admin' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {userRole === 'admin' ? 'Admin' : userRole === 'editor' ? 'Editor' : 'Viewer'}
                </span>
              </div>
            )}
          </div>
            <div className="editor-main w-full max-w-full flex-grow rounded-b-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Collaborators panel */}            {showCollaboratorsPanel && project && (              <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-[calc(100vh-220px)] overflow-hidden">
                <ErrorBoundary fallback={
                  <div className="p-4 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-3">
                      Something went wrong with the collaborators panel
                    </h3>
                    <button 
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      onClick={() => setShowCollaboratorsPanel(false)}
                    >
                      Back to Editor
                    </button>
                  </div>
                }>                  <CollaboratorsPanel 
                    projectDetails={{
                      ...(project || {}),
                      // Explicitly format owner field with proper data structure to ensure name display
                      owner: project?.owner,
                      language: language || 'javascript'
                    }}
                    isAdmin={isAdmin}
                    onClose={() => {
                      try {
                        setShowCollaboratorsPanel(false);
                      } catch (error) {
                        console.error("Error closing collaborators panel:", error);
                        // Force a refresh as last resort
                        window.location.reload();
                      }
                    }}
                    userRole={userRole} // Pass the current role explicitly
                  />
                </ErrorBoundary>
              </div>
            )}            <div className="editor-with-output">
              <div className="editor-code-pane">
                <CodeEditor 
                  language={language}
                  code={code}
                  setCode={setCode}
                  theme={theme}
                  showErrors={showErrors}
                  handleEditorDidMount={handleEditorDidMount}
                />
              </div>
              <div className={`editor-output-pane ${!showOutputPanel ? 'hidden' : ''}`}>
                <CodeOutput 
                  code={code}
                  language={language}
                  theme={theme}
                />
              </div>
                {/* Toggle button for output panel */}              <button 
                className={`output-toggle-btn ${showOutputPanel ? 'output-active' : ''}`}
                onClick={() => setShowOutputPanel(prev => !prev)}
                title={showOutputPanel ? "Hide Output Panel" : "Show Output Panel"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ 
                  transition: 'all 0.3s ease',
                  transform: showOutputPanel ? 'scale(0.85)' : 'scale(1)',
                  marginRight: showOutputPanel ? '8px' : '0'
                }}>
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zM6 16h2v-2H6v2zm0-4h8v-2H6v2zm10 4h2v-2h-2v2zm-6 0h4v-2h-4v2z"/>
                </svg>
                {showOutputPanel && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ 
                    opacity: 0.8
                  }}>
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                )}
                <span className="toggle-label">
                  {showOutputPanel ? 'Close Output' : ''}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Layout>      <LanguageChangeNotification language={language} />
      <ShareProjectModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
      />
      
      {/* Download file name dialog */}
      {showDownloadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Download Code
            </h3>
            <div className="mb-4">
              <label htmlFor="filename" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Name
              </label>
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="filename"
                  value={downloadFileName}
                  onChange={(e) => setDownloadFileName(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter file name"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-sm">
                  .{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setShowDownloadDialog(false)}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDownload}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ProjectEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
        onProjectUpdate={handleProjectUpdate}      />      {/* Collaborators panel is now shown inside the editor container */}
    </>
  );
};

// Update component to use WebSocket and Auth contexts properly
const EditorPageWithContext = (props) => {
  const { isAuthenticated, currentUser } = useAuth();
  const webSocketProps = useWebSocket();

  // Return the EditorPage with all the required contexts
  return <EditorPage {...props} webSocket={webSocketProps} auth={{ isAuthenticated, currentUser }} />;
};

export default EditorPageWithContext;
