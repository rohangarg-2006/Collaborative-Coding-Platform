// WebSocket event handlers for the collaborative platform
const Project = require('../models/Project');
const User = require('../models/User');
const Session = require('../models/Session');

// Define WebSocket event handlers
const setupSocketHandlers = (socket, io) => {
  // Store user info from auth middleware
  const userId = socket.user?.id;
  
  // Join user's personal room for direct notifications
  if (userId) {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their personal notification room`);
  }
  // Handle joining a project room
  socket.on('join_project', async (projectId) => {
    try {
      if (!projectId || !userId) return;
      
      // Check if user has access to this project
      const project = await Project.findById(projectId);
      
      if (!project) {
        return socket.emit('error', { message: 'Project not found' });
      }
      
      // Check if user is owner or collaborator (CRITICAL check for admin role assignment)
      const isOwner = project.owner.toString() === userId;
      const isCollaborator = project.collaborators.some(
        collab => collab.user.toString() === userId
      );
      
      if (!isOwner && !isCollaborator && !project.isPublic) {
        return socket.emit('error', { message: 'Not authorized to access this project' });
      }
      
      // Join project room
      socket.join(`project_${projectId}`);
      console.log(`User ${userId} joined project room: ${projectId}`);
      
      // Get user details
      const user = await User.findById(userId).select('name email');
      
      // Notify other users in the room
      socket.to(`project_${projectId}`).emit('user_joined', {
        userId,
        name: user.name || 'Anonymous',
        timestamp: new Date()
      });
      
      // Determine and send user's role - do this BEFORE sending collaborators
      // to ensure consistent state
      let userRole = 'viewer'; // Default
      let roleUpdated = false;
      
      // Double-check ownership using both methods to prevent any inconsistencies
      const ownerIdStr = project.owner.toString();
      const userIdStr = userId.toString();
      const isDefinitelyOwner = ownerIdStr === userIdStr || isOwner;
      
      if (isDefinitelyOwner) {
        userRole = 'admin'; // Project owners are always admins
        console.log(`User ${userId} is the owner of project ${projectId}, assigning admin role`);
        
        // Ensure owner is in collaborators list with admin role
        const existingCollaborator = project.collaborators.find(
          collab => collab.user.toString() === userId
        );
        
        if (!existingCollaborator) {
          // Add owner to collaborators with admin role
          project.collaborators.push({
            user: userId,
            role: 'admin',
            addedAt: new Date()
          });
          await project.save();
          console.log(`Added missing owner ${userId} to collaborators with admin role`);
          roleUpdated = true;
        } else if (existingCollaborator.role !== 'admin') {
          // Fix incorrect role for owner
          existingCollaborator.role = 'admin';
          await project.save();
          console.log(`Fixed incorrect role for owner ${userId}, updating to admin`);
          roleUpdated = true;
        }
      } else if (isCollaborator) {
        const collaborator = project.collaborators.find(
          collab => collab.user.toString() === userId
        );
        if (collaborator) {
          userRole = collaborator.role;
          console.log(`User ${userId} is a collaborator with role ${userRole} in project ${projectId}`);
        }
      }
      
      // Send the user's role first to ensure proper access rights
      socket.emit('your_role', { 
        role: userRole, 
        projectId,
        enforced: isDefinitelyOwner // Mark as enforced for owners
      });
      
      // If we updated the collaborator list, reload the project to get fresh data
      let collaborators;
      if (roleUpdated) {
        collaborators = await Project.findById(projectId)
          .populate('owner', 'name email')
          .populate('collaborators.user', 'name email');
      } else {
        collaborators = await Project.findById(projectId)
          .populate('owner', 'name email')
          .populate('collaborators.user', 'name email');
      }
      
      // Send current collaborators to the joining user
      socket.emit('current_collaborators', {
        owner: {
          _id: collaborators.owner._id,
          name: collaborators.owner.name,
          email: collaborators.owner.email,
          role: 'admin'
        },
        collaborators: collaborators.collaborators.map(collab => ({
          _id: collab.user._id,
          name: collab.user.name,
          email: collab.user.email,
          role: collab.role
        }))
      });
      
      // If the owner's role was updated, inform all connected clients about the change
      if (roleUpdated && isDefinitelyOwner) {
        io.to(`project_${projectId}`).emit('collaborator_role_changed', {
          userId,
          projectId,
          newRole: 'admin'
        });
      }
      
    } catch (error) {
      console.error('Error joining project room:', error);
      socket.emit('error', { message: 'Failed to join project room' });
    }
  });
    // Handle admin verification request
  socket.on('verify_admin_status', async (data) => {
    try {
      const { projectId, userId } = data;
      
      if (!projectId || !userId) {
        return socket.emit('error', { message: 'Missing required data for admin verification' });
      }
      
      console.log(`Verifying admin status for user ${userId} in project ${projectId}`);
      
      // Get the project
      const project = await Project.findById(projectId);
      
      if (!project) {
        return socket.emit('error', { message: 'Project not found for admin verification' });
      }
        // Check if user is the owner - this is the critical check to ensure admin access
      const isOwner = project.owner.toString() === userId.toString();
      
      if (isOwner) {
        console.log(`User ${userId} is confirmed as owner of project ${projectId}`);
        
        // Force emit their admin role again with priority enforced flag
        socket.emit('your_role', { 
          role: 'admin',
          projectId,
          enforced: true
        });
        
        // Check if user exists in collaborators - if not or not as admin, fix it
        const existingCollaborator = project.collaborators.find(
          collab => collab.user.toString() === userId.toString()
        );
        
        if (!existingCollaborator) {
          // Add owner to collaborators with admin role
          project.collaborators.push({
            user: userId,
            role: 'admin',
            addedAt: new Date()
          });
          await project.save();
          console.log(`Added owner ${userId} to collaborators with admin role`);
        } else if (existingCollaborator.role !== 'admin') {
          // Update collaborator role to admin
          existingCollaborator.role = 'admin';
          await project.save();
          console.log(`Updated owner ${userId} role to admin in collaborators`);
        }
        
        // Broadcast the updated role to all clients in this project room
        io.to(`project_${projectId}`).emit('collaborator_role_changed', {
          userId,
          projectId,
          newRole: 'admin'
        });
      }
    } catch (error) {
      console.error('Error verifying admin status:', error);
      socket.emit('error', { message: 'Failed to verify admin status' });
    }
  });
    // Handle role update via WebSocket
  socket.on('update_role', async (data) => {
    try {
      const { projectId, userId: targetUserId, newRole } = data;
      
      if (!projectId || !targetUserId || !newRole || !userId) {
        return socket.emit('error', { message: 'Missing required data' });
      }
      
      // Check if user is authorized (is project admin)
      const project = await Project.findById(projectId);
      
      if (!project) {
        return socket.emit('error', { message: 'Project not found' });
      }
      
      // Verify current user is project admin
      if (project.owner.toString() !== userId) {
        return socket.emit('error', { message: 'Not authorized to update roles' });
      }
      
      // Find target collaborator
      const collaborator = project.collaborators.find(
        collab => collab.user.toString() === targetUserId
      );
      
      if (!collaborator) {
        return socket.emit('error', { message: 'Collaborator not found' });
      }
      
      // Update role
      collaborator.role = newRole;
      await project.save();
      
      // Get admin name
      const admin = await User.findById(userId).select('name');
      
      // Get user name
      const targetUser = await User.findById(targetUserId).select('name');
      const targetUserName = targetUser ? targetUser.name : 'Collaborator';
      
      console.log(`Role updated: ${targetUserName} is now ${newRole} in project ${projectId}`);
      
      // 1. Notify the specific user about their role change via personal channel
      io.to(`user_${targetUserId}`).emit('role_updated', {
        projectId,
        projectName: project.name,
        userId: targetUserId,
        role: newRole,
        newRole: newRole, // Include both formats for compatibility
        updatedBy: admin?.name || 'Project Admin'
      });
      
      // 2. Send a direct 'your_role' event to ensure immediate UI update for the user
      // Find the socket connection for this specific user
      const userSockets = io.sockets.adapter.rooms.get(`user_${targetUserId}`);
      if (userSockets) {
        for (const socketId of userSockets) {
          const targetSocket = io.sockets.sockets.get(socketId);
          if (targetSocket) {
            targetSocket.emit('your_role', { 
              projectId,
              userId: targetUserId,
              role: newRole
            });
          }
        }
      }      
      // 3. Broadcast to everyone in the project room about the role change
      // Send both event types to ensure all components receive the update
      const roleUpdateData = {
        userId: targetUserId,
        projectId,
        newRole,
        role: newRole, // Include both formats for compatibility
        userName: targetUserName,
        updatedBy: admin?.name || 'Project Admin',
        timestamp: new Date().toISOString()
      };
      
      // Send as collaborator_role_changed
      io.to(`project_${projectId}`).emit('collaborator_role_changed', roleUpdateData);
      
      // Also send as role_updated for components listening to that event
      io.to(`project_${projectId}`).emit('role_updated', roleUpdateData);
      
      // Send a global broadcast to the project to ensure all components are updated
      // This is to make sure that even components not explicitly listening for role-specific
      // events will get the update
      io.to(`project_${projectId}`).emit('project_update', {
        type: 'role_change',
        ...roleUpdateData
      });
      
      // 4. Send success confirmation to the admin who made the change
      socket.emit('role_update_success', { 
        userId: targetUserId, 
        userName: targetUserName,
        newRole 
      });
    } catch (error) {
      console.error('Role update error:', error);
      socket.emit('error', { message: 'Failed to update role' });
    }
  });
  
  // Handle collaborator removal
  socket.on('collaborator_removed', async (data) => {
    try {
      const { projectId, userId: targetUserId, userName } = data;
      
      if (!projectId || !targetUserId || !userId) {
        return socket.emit('error', { message: 'Missing required data for collaborator removal' });
      }
      
      // Check if user is authorized (is project admin)
      const project = await Project.findById(projectId);
      
      if (!project) {
        return socket.emit('error', { message: 'Project not found' });
      }
      
      // Verify current user is project admin
      if (project.owner.toString() !== userId) {
        return socket.emit('error', { message: 'Not authorized to remove collaborators' });
      }
      
      console.log(`Collaborator removal: User ${targetUserId} removed from project ${projectId} by admin ${userId}`);
      
      // Get admin name
      const admin = await User.findById(userId).select('name');
      
      // Get target user name if not provided
      let targetUserName = userName;
      if (!targetUserName) {
        const targetUser = await User.findById(targetUserId).select('name');
        targetUserName = targetUser ? targetUser.name : 'Collaborator';
      }
      
      // Create removal data
      const removalData = {
        projectId,
        userId: targetUserId,
        userName: targetUserName,
        removedBy: admin?.name || 'Project Admin',
        timestamp: new Date().toISOString(),
        type: 'collaborator_removed'
      };
      
      // 1. Notify the specific user that they've been removed via their personal channel
      io.to(`user_${targetUserId}`).emit('collaborator_removed', removalData);
      
      // 2. Broadcast to everyone in the project room about the removal
      io.to(`project_${projectId}`).emit('collaborator_removed', removalData);
      
      // 3. Send as project_update for components listening to that event
      io.to(`project_${projectId}`).emit('project_update', removalData);
      
      // 4. Send confirmation to the admin who performed the removal
      socket.emit('collaborator_removal_success', { 
        userId: targetUserId,
        userName: targetUserName
      });
      
    } catch (error) {
      console.error('Collaborator removal error:', error);
      socket.emit('error', { message: 'Failed to process collaborator removal' });
    }
  });
};

module.exports = setupSocketHandlers;
