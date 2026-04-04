/**
 * Role utilities for the collaborative coding platform
 * Provides consistent handling of user roles across different components
 */

/**
 * Get the most accurate user role for a project
 * Uses multiple sources to determine the correct role with proper priority
 */
export const getUserRole = (options) => {
  const {
    projectId,
    userId,
    collaborators = [],
    isProjectOwner = false,
    isProjectCreator = false,
    parentProvidedRole = null,
    localStoragePrefix = 'project_role_',
    useConsoleOutput = false,
  } = options;

  if (useConsoleOutput) {
    console.group('Get User Role - Debugging');
    console.log('Project ID:', projectId);
    console.log('User ID:', userId);
    console.log('Is Project Owner:', isProjectOwner);
    console.log('Is Project Creator:', isProjectCreator);
    console.log('Parent Provided Role:', parentProvidedRole);
    console.groupEnd();
  }

  // PRIORITY 1: If user is project owner/creator, they should always be admin
  if (isProjectOwner || isProjectCreator) {
    return 'admin';
  }

  // PRIORITY 2: Use parent-provided role if available (most accurate at runtime)
  if (parentProvidedRole) {
    return parentProvidedRole;
  }

  // PRIORITY 3: Check collaborators list for this specific user
  if (collaborators && collaborators.length > 0 && userId) {
    const userCollaborator = collaborators.find(
      collab => 
        (typeof collab.user === 'object' && collab.user._id === userId) || 
        (typeof collab.user === 'string' && collab.user === userId)
    );
    
    if (userCollaborator?.role) {
      return userCollaborator.role;
    }
  }

  // PRIORITY 4: Check localStorage (useful for real-time updates)
  if (projectId) {
    const storedRole = localStorage.getItem(`${localStoragePrefix}${projectId}`);
    if (storedRole) {
      return storedRole;
    }
  }

  // FALLBACK: Default to viewer role if no other role is found
  return 'viewer';
};

/**
 * Save a user's role to localStorage for persistence
 */
export const saveUserRole = (projectId, role) => {
  if (projectId && role) {
    localStorage.setItem(`project_role_${projectId}`, role);
    return true;
  }
  return false;
};

/**
 * Convert a technical role name to a user-friendly display string
 */
export const getRoleDisplayName = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    case 'viewer': 
      return 'Viewer';
    default:
      return role || 'Unknown';
  }
};

/**
 * Get the appropriate CSS classes for role badges
 */
export const getRoleBadgeClasses = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case 'editor':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    case 'viewer':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  }
};

/**
 * Check if a user has sufficient permissions for a specific action
 * @param {string} userRole - The user's current role
 * @param {string} requiredRole - The minimum role required for the action
 * @returns {boolean} - Whether the user has sufficient permissions
 */
export const hasPermission = (userRole, requiredRole) => {
  const rolePriority = {
    'admin': 3,
    'editor': 2,
    'viewer': 1
  };

  const userPriority = rolePriority[userRole?.toLowerCase()] || 0;
  const requiredPriority = rolePriority[requiredRole?.toLowerCase()] || 0;

  return userPriority >= requiredPriority;
};

/**
 * Get the role icon component name for consistent display
 * @param {string} role - The role to get the icon for
 * @returns {string} - The icon name to use
 */
export const getRoleIconName = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'ShieldCheckIcon';
    case 'editor':
      return 'PencilIcon';
    case 'viewer':
      return 'EyeIcon';
    default:
      return 'UserIcon';
  }
};

/**
 * Generate a timestamp key for forcing re-renders when role changes
 * @param {string} projectId - The project ID 
 * @param {string} role - The user's role
 * @returns {string} - A unique key that changes when role changes
 */
export const getRoleRenderKey = (projectId, role) => {
  return `role-${projectId}-${role}-${Date.now()}`;
};
