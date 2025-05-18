import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ProjectService } from '../utils/projectService';
import ProjectCreateModal from '../components/editor/ProjectCreateModal';
import ProjectRenameModal from '../components/editor/ProjectRenameModal';
import ProjectEditModal from '../components/editor/ProjectEditModal';
import JoinProjectModal from '../components/editor/JoinProjectModal';
import RoleChangeAnimation from '../components/common/RoleChangeAnimation';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { getRoleDisplayName, getRoleRenderKey } from '../utils/roleUtils';

const ProjectListPage = ({ theme = 'light', setTheme = () => {} }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { currentUser } = useAuth();
  const { roleUpdates } = useWebSocket();
  
  const navigate = useNavigate();
  
  // Get language display name
  const getLanguageDisplayName = (langKey) => {
    const languages = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'csharp': 'C#',
      'cpp': 'C++',
      'go': 'Go',
      'ruby': 'Ruby',
      'php': 'PHP',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'markdown': 'Markdown'
    };
    
    return languages[langKey] || langKey;
  };
  
  // Calculate time ago string
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    if (interval === 1) return 'a year ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    if (interval === 1) return 'a month ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    if (interval === 1) return 'yesterday';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    if (interval === 1) return 'an hour ago';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    if (interval === 1) return 'a minute ago';
    
    return 'just now';
  };  // Define loadProjects as a reusable callback that can be triggered when needed
  const loadProjects = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching projects from server...');
      const projectData = await ProjectService.getAllProjects();
      
      // Process projects to ensure correct roles are set
      const processedProjects = projectData?.map(project => {
        // If user is project owner, ensure they have admin role
        if (project.owner && project.owner._id === currentUser?.id) {
          localStorage.setItem('project_creator_' + project._id, 'true');
          localStorage.setItem('project_role_' + project._id, 'admin');
          
          // Ensure collaborator entry exists with admin role
          const collaboratorsList = project.collaborators || [];
          const isUserCollaborator = collaboratorsList.some(c => {
            const userId = typeof c.user === 'object' ? c.user._id : c.user;
            return userId === currentUser?.id && c.role === 'admin';
          });
          
          if (!isUserCollaborator) {
            // Add user as admin collaborator if not already present
            const updatedCollaborators = [...collaboratorsList];
            updatedCollaborators.push({
              user: currentUser.id,
              role: 'admin'
            });
            project.collaborators = updatedCollaborators;
          }
        } else {
          // Check localStorage for cached role information
          const storedRole = localStorage.getItem('project_role_' + project._id);
          
          // Don't overwrite server role data with localStorage if collaborator entry exists
          const collaboratorEntry = project.collaborators?.find(c => {
            const userId = typeof c.user === 'object' ? c.user._id : c.user;
            return userId === currentUser?.id;
          });
          
          if (storedRole && !collaboratorEntry) {
            // Create a collaborator entry with the stored role
            const collaborators = project.collaborators || [];
            collaborators.push({
              user: currentUser.id,
              role: storedRole
            });
            project.collaborators = collaborators;
            
            console.log(`Applied localStorage role '${storedRole}' for project ${project.name}`);
          } else if (collaboratorEntry) {
            // IMPORTANT: Always sync localStorage with server data
            // This ensures that if role was changed by admin, we'll see the new role
            localStorage.setItem('project_role_' + project._id, collaboratorEntry.role);
            console.log(`Updated localStorage role to '${collaboratorEntry.role}' for project ${project.name}`);
          }
        }
        
        return project;
      });
      
      setProjects(processedProjects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);
  
  // Load projects on initial mount and when user changes
  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }
  }, [currentUser, loadProjects]);
  
  // Reload projects when refreshTrigger changes (triggered by role updates)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadProjects();
    }
  }, [refreshTrigger, loadProjects]);
  // Handle project creation  
  const handleCreateProject = async (name, description, isPublic, language) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Create the new project
      const newProject = await ProjectService.createProject({
        name,
        description,
        language: language || 'javascript',
        isPublic: isPublic ?? false
      });
      
      // Close the modal
      setIsCreateModalOpen(false);
      
      console.log('Project created successfully:', newProject._id);
      
      // Ensure the project has the creator marked as admin      // Store admin state in localStorage for persistence across page navigations
      // CRITICAL: This ensures the creator is always recognized as admin
      localStorage.setItem('project_creator_' + newProject._id, 'true');
      localStorage.setItem('project_role_' + newProject._id, 'admin');
      
      // Make sure the project has collaborators array initialized
      if (!newProject.collaborators) {
        newProject.collaborators = [];
      }

      // Ensure the creator is in the collaborators list with admin role
      const creatorAsCollaborator = newProject.collaborators.find(
        collab => collab.user && (
          // Check both string and object _id formats
          (typeof collab.user === 'string' && collab.user === currentUser?.id) ||
          (collab.user._id && collab.user._id === currentUser?.id)
        )
      );

      // If creator is in the collaborators list but not as admin, update their role
      if (creatorAsCollaborator && creatorAsCollaborator.role !== 'admin') {
        creatorAsCollaborator.role = 'admin';
      }
      // If creator is not in collaborators list, add them with admin role
      else if (!creatorAsCollaborator && currentUser) {
        newProject.collaborators.push({
          user: {
            _id: currentUser.id,
            username: currentUser.username,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName
          },
          role: 'admin',
          addedAt: new Date()
        });
      }
      
      try {
        // Update the projects list to include the new project
        setProjects(prev => [...prev, newProject]);
        
        // Set a success message
        setSuccessMsg(`Project "${name}" created successfully!`);
        
        // Navigate to the new project after a short delay
        // This delay ensures localStorage is set before navigation
        setTimeout(() => {
          navigate(`/editor/${newProject._id}`);
        }, 300);
      } catch (innerError) {
        console.error('Error during post-creation operations:', innerError);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle renaming a project
  const handleRenameProject = async (projectId, newName) => {
    try {
      setIsLoading(true);
      setError('');
      await ProjectService.updateProject(projectId, { name: newName });
      
      // Update the projects list with the new name
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project._id === projectId ? { ...project, name: newName } : project
        )
      );
      
      setSuccessMsg('Project renamed successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      console.error('Error renaming project:', error);
      setError('Failed to rename project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
    // Open the rename modal for a specific project
  const openRenameModal = (project) => {
    setSelectedProject(project);
    setIsRenameModalOpen(true);
  };

  // Open the edit modal for a specific project
  const openEditModal = (project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };
  
  // Handle project update
  const handleProjectUpdate = (updatedProject) => {
    // Update the projects list with the updated project data
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project._id === updatedProject._id ? { ...project, ...updatedProject } : project
      )
    );
    
    setSuccessMsg('Project updated successfully!');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Handle joining a project with invite code
  const handleJoinProject = async (inviteCode) => {
    try {
      setIsLoading(true);
      setError('');
      const project = await ProjectService.joinProjectByInviteCode(inviteCode);
      
      setIsJoinModalOpen(false);
      setSuccessMsg(`Successfully joined project: ${project.name}`);
      
      // Refresh projects list
      const projectData = await ProjectService.getAllProjects();
      setProjects(projectData || []);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error joining project:', error);
      setError(typeof error === 'string' ? error : 'Failed to join project. Please check the invite code and try again.');
      setIsLoading(false);
    }
  }
  
  // Handle project deletion
  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ProjectService.deleteProject(projectId);
      setSuccessMsg('Project deleted successfully');
      // Remove the project from the list
      setProjects(projects.filter(p => p._id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project. Please try again.');
    }
  };
  // Clear messages after some time
  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);
    // Effect to run whenever the component becomes visible again
  // This helps refresh projects when returning to this page after being away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing projects');
        loadProjects();
      }
    };
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadProjects]);
  
  // CRITICAL FIX: Direct event listener for instant role updates
  // This event comes from WebSocketContext when a role changes
  useEffect(() => {
    const handleImmediateRoleUpdate = (event) => {
      const { projectId, newRole } = event.detail;
      
      console.log(`⚡ Immediate role update triggered for project ${projectId} with role ${newRole}`);
      
      // Update the project in the current state without a full reload
      setProjects(currentProjects => 
        currentProjects.map(project => {
          if (project._id === projectId) {
            // Deep clone to avoid mutation
            const updatedProject = {...project};
            
            // Update collaborator entry or create one if needed
            if (!updatedProject.collaborators) {
              updatedProject.collaborators = [];
            }
            
            const collaborator = updatedProject.collaborators.find(c => {
              if (typeof c.user === 'object') {
                return c.user._id === currentUser?.id;
              } else {
                return c.user === currentUser?.id;
              }
            });
            
            if (collaborator) {
              collaborator.role = newRole;
            } else {
              updatedProject.collaborators.push({
                user: currentUser.id,
                role: newRole
              });
            }
            
            console.log(`✅ Updated project ${project.name} with new role: ${newRole}`);
            return updatedProject;
          }
          return project;
        })
      );
    };
    
    document.addEventListener('roleUpdated', handleImmediateRoleUpdate);
    
    return () => {
      document.removeEventListener('roleUpdated', handleImmediateRoleUpdate);
    };
  }, [currentUser]);
    // Listen to real-time role updates from WebSocketContext
  useEffect(() => {
    if (!currentUser || !roleUpdates || roleUpdates.length === 0) return;
    
    // Check if any of the role updates is relevant to our projects
    const latestUpdate = [...roleUpdates].sort((a, b) => {
      // Sort by timestamp, newest first
      return new Date(b.timestamp) - new Date(a.timestamp);
    })[0];
    
    if (!latestUpdate) return;
    
    console.log('Processing role update in ProjectListPage:', latestUpdate);
      // Check if this update is for the current user
    const currentUserId = currentUser?.id || currentUser?._id;
    const isForCurrentUser = 
      !latestUpdate.userId || // No userId means it's a broadcast
      latestUpdate.userId?.toString() === currentUserId?.toString(); // Or it matches current user
      
    // ENHANCED: Always refresh when roles change, even if not for current user
    // This ensures that if you're looking at a project list while an admin is changing roles,
    // all users will see the changes in real-time
    if (latestUpdate.projectId) {
      // Force refresh projects list to get updated roles from server
      setRefreshTrigger(prev => prev + 1);
      
      if (isForCurrentUser) {
        // Trigger an immediate UI update for better user experience
        const projectId = latestUpdate.projectId;
        const newRole = latestUpdate.role || latestUpdate.newRole;
        
        // Update localStorage right away
        localStorage.setItem('project_role_' + projectId, newRole);
        
        // Log the update
        console.log(`🔄 Triggered project list refresh due to role update: ${newRole}`);
        
        // Force UI refresh immediately without waiting for the network refresh
        document.dispatchEvent(new CustomEvent('roleUpdated', { 
          detail: { 
            projectId: projectId,
            newRole: newRole
          }
        }));
      } else {
        // Still refresh but less urgently if this change was for another user
        console.log(`Refreshing project list due to role change for another user`);
      }
    }
  }, [roleUpdates, currentUser]);
  
  // Ensure project roles are correctly loaded from localStorage
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    
    // Create a copy of projects for potential updates
    const projectsWithRoles = [...projects];
    let hasUpdates = false;
    
    // Check each project for stored role information
    projectsWithRoles.forEach(project => {
      // Skip if project doesn't have an ID
      if (!project._id) return;
      
      // Look for collaborator info
      const collaborator = project.collaborators?.find(c => {
        if (typeof c.user === 'object') {
          return c.user._id === currentUser?.id;
        } else {
          return c.user === currentUser?.id;
        }
      });
      
      // If no collaborator info found, check localStorage
      if (!collaborator?.role) {
        const storedRole = localStorage.getItem('project_role_' + project._id);
        
        if (storedRole && storedRole !== 'viewer') {
          // Create or update collaborator entry
          if (!project.collaborators) {
            project.collaborators = [];
          }
          
          const existingIndex = project.collaborators.findIndex(c => {
            if (typeof c.user === 'object') {
              return c.user._id === currentUser?.id;
            } else {
              return c.user === currentUser?.id;
            }
          });
          
          if (existingIndex >= 0) {
            project.collaborators[existingIndex].role = storedRole;
          } else {
            project.collaborators.push({ 
              user: currentUser?.id, 
              role: storedRole 
            });
          }
          
          hasUpdates = true;
        }
      }
      
      // Special case: if user is project owner, ensure admin role
      if (project.owner && project.owner._id === currentUser?.id) {
        const existingIndex = project.collaborators?.findIndex(c => {
          if (typeof c.user === 'object') {
            return c.user._id === currentUser?.id;
          } else {
            return c.user === currentUser?.id;
          }
        });
        
        if (existingIndex >= 0) {
          if (project.collaborators[existingIndex].role !== 'admin') {
            project.collaborators[existingIndex].role = 'admin';
            hasUpdates = true;
          }
        } else {
          if (!project.collaborators) {
            project.collaborators = [];
          }
          
          project.collaborators.push({
            user: currentUser?.id,
            role: 'admin'
          });
          
          hasUpdates = true;
        }
        
        // Always ensure the localStorage is set for project owners
        localStorage.setItem('project_creator_' + project._id, 'true');
        localStorage.setItem('project_role_' + project._id, 'admin');
      }
    });
    
    // Only update if changes were made
    if (hasUpdates) {
      setProjects(projectsWithRoles);
    }
  }, [projects, currentUser]);
  
  return (
    <Layout theme={theme} setTheme={setTheme}>
      <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-b from-[#4338ca] via-[#23283a] to-[#1a1333]">
        {/* Navigation */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link to="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Home
          </Link>
          <Link to="/profile" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            My Profile
          </Link>
        </div>
          {/* Header */}        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Projects</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center space-x-2 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              <span>Join with Invite Code</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center space-x-2 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>New Project</span>
            </button>
          </div>
        </div>
          {/* Success message */}
        {successMsg && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 dark:bg-green-900 dark:text-green-200">
            <p>{successMsg}</p>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 dark:bg-red-900 dark:text-red-200">
            <p>{error}</p>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xl text-gray-700 dark:text-gray-300">Loading projects...</span>
            </div>
          </div>
        )}
          {/* Empty state */}
        {!isLoading && projects.length === 0 && (          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">No projects available</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">You don't have any projects yet. Create a new project or join an existing one as a collaborator.</p>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => setIsJoinModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Join Project
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Create Project
              </button>
            </div>
          </div>
        )}
        
        {/* Project list */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project._id} 
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                <Link 
                  to={`/editor/${project._id}`}
                  className="p-6 flex-1"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{project.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.isPublic 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {project.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}
                    {/* Display creator info and user's role */}
                  <div className="mt-2 mb-3 flex flex-col">                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium mr-1">Created by:</span>
                      <span className="flex items-center">
                        {project.owner && project.owner._id === currentUser?.id ? (
                          <>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">You (Admin)</span>
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Admin
                            </span>
                          </>
                        ) : (
                          project.owner ? `${project.owner.firstName || project.owner.username || 'User'}` : 'Unknown'
                        )}
                      </span>
                    </div>                    {/* Show role for non-owners and ensure owner always shows as admin */}
                    {(() => {
                      // Check localStorage for creator status and role
                      const isCreator = localStorage.getItem('project_creator_' + project._id) === 'true';
                      const storedRole = localStorage.getItem('project_role_' + project._id);                        // If you're the owner, explicitly show admin badge
                      // We're now handling this in the next section to ensure it always shows properly
                      if (project.owner && project.owner._id === currentUser?.id) {
                        // CRITICAL: Ensure creator has admin status in localStorage
                        localStorage.setItem('project_creator_' + project._id, 'true');
                        localStorage.setItem('project_role_' + project._id, 'admin');
                      }
                      
                      // For non-owners, show role
                      return (
                        <div className="flex items-center text-xs mt-1">
                          <span className="font-medium mr-1 text-gray-500 dark:text-gray-400">Your role:</span>{(() => {
    // CRITICAL FIX: Check if user is the owner or creator first
    if (project.owner && project.owner._id === currentUser?.id ||
        localStorage.getItem('project_creator_' + project._id) === 'true') {
      // Force admin role for project creator/owner
      return (
        <RoleChangeAnimation
          role="admin"
          projectId={project._id}
          showFullName={true}
        />
      );
    }

    // For non-owners, check collaborator role
    const collaborator = project.collaborators?.find(c => {
      if (typeof c.user === 'object') {
        return c.user._id === currentUser?.id;
      } else {
        return c.user === currentUser?.id;
      }
    });

    // CRITICAL FIX: Get the most up-to-date role from different sources
    // First, check if there's a collaborator entry from the server
    let role = collaborator?.role;
    const storedRole = localStorage.getItem('project_role_' + project._id);
    
    // Compare timestamps - this is a key improvement
    const roleLastUpdated = localStorage.getItem('project_role_timestamp_' + project._id);
    const roleTimestamp = roleLastUpdated ? parseInt(roleLastUpdated) : 0;
    
    // If server data is missing OR localStorage has a newer update, use localStorage
    if (!role || (storedRole && roleTimestamp > project.updatedAt)) {
      if (storedRole) {
        role = storedRole;
        console.log(`📋 Using localStorage role for ${project.name}: ${role}`);
      } else {
        role = 'viewer'; // Default fallback
      }
    } else {
      // If we do have a role from server, make sure localStorage is in sync
      if (role) {
        localStorage.setItem('project_role_' + project._id, role);
        localStorage.setItem('project_role_timestamp_' + project._id, Date.now());
        console.log(`💾 Updating localStorage with server role ${role} for ${project.name}`);
      }
    }
    
    // Record current role for future debugging
    console.log(`⭐ Project ${project.name} - Final Role: ${role}`);
      // Use our enhanced RoleChangeAnimation component with more compact size
    return (
      <RoleChangeAnimation
        role={role || 'viewer'}
        projectId={project._id}
        showFullName={true}
        compact={true}
      />
    );
  })()}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                      {getLanguageDisplayName(project.language)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {getTimeAgo(project.updatedAt)}
                    </span>
                  </div>                </Link>                <div className="mt-2 p-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap justify-between items-center mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {project.createdAt ? `Created: ${new Date(project.createdAt).toLocaleDateString()}` : ''}
                    </span>                    {/* Project action buttons - Always visible */}                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          openRenameModal(project);
                        }}
                        className="text-xs px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                      >
                        Rename
                      </button>
                    </div>
                  </div>                  {/* Invite Code Section - Made more prominent, but only for public projects */}
                  {project.inviteCode && project.isPublic !== false && (
                    <div className="mt-3 mb-3 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-md border border-indigo-100 dark:border-indigo-800">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            Invite Code:
                          </span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(project.inviteCode);
                              // Show a temporary "Copied" message
                              const button = e.currentTarget;
                              const originalText = button.textContent;
                              button.textContent = "Copied!";
                              setTimeout(() => button.textContent = originalText, 2000);
                            }}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition"
                          >
                            Copy Code
                          </button>
                        </div>
                        <div className="w-full text-center px-3 py-2 bg-gray-100 dark:bg-gray-700 font-mono text-sm rounded-md select-all">
                          {project.inviteCode}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show private project notice */}
                  {project.isPublic === false && (
                    <div className="mt-3 mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-100 dark:border-yellow-800">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-yellow-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-yellow-700 dark:text-yellow-300">
                          Private project - No collaborators allowed
                        </span>
                      </div>
                    </div>
                  )}                  <div className="flex justify-end space-x-2">                    <Link 
                      to={`/editor/${project._id}`}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Open
                    </Link>                    {/* Edit button - Always visible */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                      Edit
                    </button>
  
                    
                    {/* Only show share button for public projects */}
                    {project.isPublic !== false && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (project.inviteCode) {
                            const inviteText = `Join my project on CodeCollab! Use invite code: ${project.inviteCode}`;
                            navigator.clipboard.writeText(inviteText);
                            // Show a temporary message
                            const button = e.currentTarget;
                            const originalContent = button.innerHTML;
                            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>Copied!`;
                            setTimeout(() => button.innerHTML = originalContent, 2000);
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                        Share
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDeleteProject(e, project._id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>                  </div>
                </div>
              </div>
            ))}          </div>
        )}
      
        {/* Project creation modal */}
        <ProjectCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateProject}
          isLoading={isLoading}
        />        {/* Join project modal */}
        <JoinProjectModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onJoin={handleJoinProject}
          isLoading={isLoading}
        />
        
        {/* Rename project modal */}        <ProjectRenameModal
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
          onRename={handleRenameProject}
          currentName={selectedProject?.name || ''}
          projectId={selectedProject?._id}
        />
          {/* Project Edit Modal */}
        <ProjectEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={selectedProject}
          onProjectUpdate={handleProjectUpdate}
        />
      </div>
    </Layout>
  );
};

export default ProjectListPage;
