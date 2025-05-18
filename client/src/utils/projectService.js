import axios from 'axios';
import AuthService from './authService';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://codecollab-backend-1org.onrender.com/api/v1';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Project service for managing coding projects
const ProjectService = {
  // Get all projects for the current user (owned and collaborated)
  getAllProjects: async () => {
    try {
      const response = await api.get('/projects');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch projects';
    }
  },
  
  // Get a single project by ID
  getProject: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch project';
    }
  },
  
  // Create a new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create project';
    }
  },
  
  // Update project details
  updateProject: async (id, projectData) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update project';
    }
  },
  
  // Update project code
  updateProjectCode: async (id, code, version) => {
    try {
      const response = await api.put(`/projects/${id}/code`, { code, version });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update code';
    }
  },
  
  // Delete a project
  deleteProject: async (id) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete project';
    }
  },
  
  // Join a project by invite code
  joinProjectByInviteCode: async (inviteCode) => {
    try {
      const response = await api.post('/projects/join', { inviteCode });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to join project';
    }
  },
  
  // Add a collaborator to a project
  addCollaborator: async (projectId, username, role) => {
    try {
      const response = await api.post(`/projects/${projectId}/collaborators`, {
        username,
        role
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add collaborator';
    }
  },
  
  // Remove a collaborator from a project
  removeCollaborator: async (projectId, userId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/collaborators/${userId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to remove collaborator';
    }
  },
  
  // Get all collaborators for a project
  getProjectCollaborators: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/collaborators`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch collaborators';
    }
  },
  
  // Update collaborator role (admin only)
  updateCollaboratorRole: async (projectId, userId, role) => {
    try {
      const response = await api.put(`/projects/${projectId}/collaborators/${userId}`, { role });
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('You must be the project admin to change collaborator roles');
      }
      throw error.response?.data?.error || 'Failed to update collaborator role';
    }
  },
  
  // Check user's role in a project
  getUserRoleInProject: async (projectId) => {
    try {
      const project = await ProjectService.getProject(projectId);
      const currentUser = AuthService.getStoredUser();
      
      if (!project || !currentUser) {
        return 'viewer'; // Default fallback role
      }
      
      // Check if user is owner/admin
      if (project.owner === currentUser.id) {
        return 'admin';
      }
      
      // Check if user is a collaborator
      const collaborator = project.collaborators?.find(
        collab => collab.user === currentUser.id
      );
      
      return collaborator?.role || 'viewer';
    } catch (error) {
      console.error('Error determining user role:', error);
      return 'viewer'; // Default fallback role
    }
  },
  // Utility to ensure the user has proper admin status if they're the creator
  ensureCreatorHasAdminRole: (project) => {
    try {
      const currentUser = AuthService.getStoredUser();
      if (!project || !currentUser) return false;
      
      // Get stored role from localStorage
      const storedRole = localStorage.getItem('project_role_' + project._id);
      const isProjectCreator = localStorage.getItem('project_creator_' + project._id) === 'true';
      
      // Check if user is the project owner (comparing IDs as strings)
      const isOwner = 
        (typeof project.owner === 'object' && project.owner?._id?.toString() === currentUser.id?.toString()) ||
        (typeof project.owner === 'string' && project.owner.toString() === currentUser.id?.toString());
      
      // Find if the user is in collaborators list and what role they have
      let collaboratorRole = null;
      let collaboratorFound = false;
      
      if (project.collaborators && project.collaborators.length > 0) {
        const collaborator = project.collaborators.find(collab => {
          // Handle both object and string user references
          if (typeof collab.user === 'object') {
            return collab.user?._id?.toString() === currentUser.id?.toString();
          } else {
            return collab.user?.toString() === currentUser.id?.toString();
          }
        });
        
        if (collaborator) {
          collaboratorFound = true;
          collaboratorRole = collaborator.role;
        }
      }
      
      // Debug logging to help trace issues
      console.log('ensureCreatorHasAdminRole check:', {
        projectId: project._id,
        isOwner,
        isProjectCreator,
        storedRole,
        collaboratorFound,
        collaboratorRole,
        ownerId: typeof project.owner === 'object' ? project.owner._id : project.owner,
        currentUserId: currentUser.id
      });
      
      // If this user is the owner or creator of the project, they should always be admin
      if (isOwner || isProjectCreator) {
        // Always mark as creator and admin in localStorage for persistence
        localStorage.setItem('project_creator_' + project._id, 'true');
        localStorage.setItem('project_role_' + project._id, 'admin');
        
        // Multiple enforcement - first immediate
        WebSocketService.enforceAdminStatus(project._id, currentUser.id);
        
        // Then with delays to overcome race conditions
        setTimeout(() => {
          WebSocketService.enforceAdminStatus(project._id, currentUser.id);
        }, 100);
        
        setTimeout(() => {
          WebSocketService.enforceAdminStatus(project._id, currentUser.id);
        }, 500);
        
        // If they're a collaborator but not admin, try to fix it locally and on server
        if (collaboratorFound) {
          if (collaboratorRole !== 'admin') {
            console.log('Owner found as non-admin collaborator, attempting to fix...');
            try {
              // Update local state to admin
              if (project.collaborators) {
                for (let i = 0; i < project.collaborators.length; i++) {
                  const collab = project.collaborators[i];
                  const collabUserId = typeof collab.user === 'object' ? collab.user?._id : collab.user;
                  
                  if (collabUserId?.toString() === currentUser.id?.toString()) {
                    collab.role = 'admin';
                    break;
                  }
                }
              }
              
              // Additional server-side update through API for persistency
              setTimeout(async () => {
                try {
                  // Force update on the server via API as well
                  await ProjectService.updateCollaboratorRole(project._id, currentUser.id, 'admin');
                } catch (err) {
                  console.error('API call to fix admin role failed:', err);
                }
              }, 200);
              
            } catch (err) {
              console.error('Error fixing collaborator role locally:', err);
            }
          }
        } else {
          // If they're not in collaborators list at all, this is a more serious issue
          console.log('Owner not found in collaborators list, attempting to fix via WebSocket...');
          // The verify_admin_status call should add them to collaborators with admin role
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in ensureCreatorHasAdminRole:', error);
      return false;
    }
  }
};

// Session service for managing coding sessions
const SessionService = {
  // Create a new session
  createSession: async (projectId) => {
    try {
      const response = await api.post('/sessions', { projectId });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create session';
    }
  },
    // Get all sessions for a specific project
  getProjectSessions: async (projectId) => {
    try {
      console.log(`Fetching sessions for project ID: ${projectId}`);
      const response = await api.get(`/projects/${projectId}/sessions`);
      console.log("Server response:", response);
      
      // Always ensure we return an array
      const sessions = response?.data?.data || [];
      console.log("Parsed sessions:", sessions);
      
      return sessions;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      // In case of error, return empty array instead of throwing
      // This ensures UI doesn't break when API fails
      return [];
    }
  },
  
  // Get all active sessions for the current user
  getAllSessions: async () => {
    try {
      const response = await api.get('/sessions');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch sessions';
    }
  },
  
  // Get a single session by ID
  getSession: async (id) => {
    try {
      const response = await api.get(`/sessions/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch session';
    }
  },
  
  // End a session
  endSession: async (id) => {
    try {
      const response = await api.put(`/sessions/${id}/end`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to end session';
    }
  },
    // Get chat messages for a session
  getChatMessages: async (sessionId) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/chat`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch chat messages';
    }
  },
  
  // Add a chat message to a session
  addChatMessage: async (sessionId, message) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/chat`, { message });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to send message';
    }
  },

  // Join a session
  joinSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/join`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to join session';
    }
  },
  
  // Leave a session
  leaveSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/leave`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to leave session';
    }
  }
};

export { ProjectService, SessionService };
