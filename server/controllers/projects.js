const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Session = require('../models/Session');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a new project
// @route   POST /api/v1/projects
// @access  Private
exports.createProject = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  // Add owner to body
  req.body.owner = req.user.id;
  
  // Generate a unique invite code if not provided
  if (!req.body.inviteCode) {
    const crypto = require('crypto');
    req.body.inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }
    // Create the project
  const project = await Project.create(req.body);

  // Add project owner as an admin collaborator to ensure consistent role system
  project.collaborators.push({
    user: req.user.id,
    role: 'admin', // Always ensure project creator has admin access
    addedAt: Date.now()
  });
  
  // Force save to ensure the collaborator entry is persisted
  await project.save();

  // Add project to user's projects
  await User.findByIdAndUpdate(
    req.user.id,
    { $push: { projects: project._id } },
    { new: true }
  );

  // Populate owner info to include it in the response
  await project.populate({
    path: 'owner',
    select: 'username firstName lastName profilePicture'
  });

  res.status(201).json({
    success: true,
    data: project
  });
});

// @desc    Get all projects (with filtering)
// @route   GET /api/v1/projects
// @access  Private
// @desc    Join a project by invite code
// @route   POST /api/v1/projects/join
// @access  Private
exports.joinProjectByInviteCode = asyncHandler(async (req, res, next) => {
  const { inviteCode } = req.body;

  if (!inviteCode) {
    return next(new ErrorResponse('Please provide an invite code', 400));
  }
  // Find project by invite code
  const project = await Project.findOne({ inviteCode: inviteCode.toUpperCase() });

  if (!project) {
    return next(new ErrorResponse('Invalid invite code or project not found', 404));
  }
  
  // Check if project is private
  if (project.isPublic === false) {
    return next(new ErrorResponse('This project is private and does not allow new collaborators', 403));
  }

  // Check if user is already a collaborator or owner
  if (project.owner.toString() === req.user.id) {
    return next(new ErrorResponse('You are already the owner of this project', 400));
  }

  const isCollaborator = project.collaborators.some(
    collab => collab.user.toString() === req.user.id
  );

  if (isCollaborator) {
    return next(new ErrorResponse('You are already a collaborator on this project', 400));
  }
  // Add user as a collaborator with default 'viewer' role
  project.collaborators.push({
    user: req.user.id,
    role: 'viewer', // Default role is viewer until admin changes it
    addedAt: Date.now()
  });

  await project.save();

  res.status(200).json({
    success: true,
    data: project
  });
});

exports.getProjects = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  if (req.user.role !== 'admin') {
    // Regular users can only see their own projects and projects where they are collaborators
    query = Project.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    });
  } else {
    // Admins can see all projects
    query = Project.find(JSON.parse(queryStr));
  }
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Project.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Populate owner and collaborators but don't transform any fields
  query = query.populate({
    path: 'owner',
    select: 'username firstName lastName profilePicture'
  }).populate({
    path: 'collaborators.user',
    select: 'username firstName lastName profilePicture'
  });
  
  // Explicitly tell mongoose not to modify the document
  query = query.lean();
  // Execute query
  const projects = await query;

  // Process projects to ensure consistent roles
  projects.forEach(project => {
    // If current user is owner, make sure they're in the collaborators list with admin role
    if (project.owner._id.toString() === req.user.id.toString()) {
      // Check if owner is in collaborators list
      const ownerAsCollaborator = project.collaborators.find(
        collab => collab.user && collab.user._id && collab.user._id.toString() === req.user.id.toString()
      );
      
      // If not in list, add them
      if (!ownerAsCollaborator) {
        project.collaborators.push({
          user: {
            _id: req.user.id,
            username: req.user.username,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            profilePicture: req.user.profilePicture
          },
          role: 'admin',
          addedAt: new Date()
        });
      } 
      // If in list but wrong role, fix it
      else if (ownerAsCollaborator.role !== 'admin') {
        ownerAsCollaborator.role = 'admin';
      }
    }
  });

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: projects.length,
    pagination,
    data: projects
  });
});

// @desc    Get single project
// @route   GET /api/v1/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate({
      path: 'owner',
      select: 'username firstName lastName profilePicture'
    })    .populate({
      path: 'collaborators.user',
      select: 'username firstName lastName profilePicture'
    })
    .lean(); // Use lean to get a plain JS object without Mongoose document methods

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is authorized to view this project
  if (project.owner._id.toString() !== req.user.id && 
      !project.isPublic && 
      !project.collaborators.some(collab => collab.user._id.toString() === req.user.id)) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to view this project`, 403));
  }

  // Ensure the owner is in collaborators list with admin role
  const currentUserId = req.user.id;
  const isCurrentUserOwner = project.owner._id.toString() === currentUserId.toString();

  // If current user is the owner, ensure they see themselves with admin role
  if (isCurrentUserOwner) {
    // Check if owner exists in collaborators array
    const ownerAsCollaborator = project.collaborators.find(
      collab => collab.user._id.toString() === currentUserId.toString()
    );
    
    if (!ownerAsCollaborator) {
      // Add owner to collaborators with admin role
      project.collaborators.push({
        user: {
          _id: project.owner._id,
          username: project.owner.username,
          firstName: project.owner.firstName,
          lastName: project.owner.lastName,
          profilePicture: project.owner.profilePicture
        },
        role: 'admin',
        addedAt: new Date()
      });
    } else if (ownerAsCollaborator.role !== 'admin') {
      // Fix role if it's not admin
      ownerAsCollaborator.role = 'admin';
    }
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }
  // Make sure user is project owner or admin (no regular collaborators allowed)
  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this project`, 403));
  }
  // Don't allow updating the owner or invite code
  delete req.body.owner;
  delete req.body.inviteCode; // Prevent invite code from being changed
  
  // Update the project
  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
// @access  Private
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }
  // Make sure user is project owner or admin (no regular collaborators allowed, even with admin role)
  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this project`, 403));
  }

  // Remove project from owner's projects array
  await User.findByIdAndUpdate(
    project.owner,
    { $pull: { projects: project._id } },
    { new: true }
  );

  // Delete associated sessions
  await Session.deleteMany({ project: project._id });

  // Delete the project
  await project.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add collaborator to project
// @route   POST /api/v1/projects/:id/collaborators
// @access  Private
exports.addCollaborator = asyncHandler(async (req, res, next) => {
  const { username, role } = req.body;

  if (!username || !role) {
    return next(new ErrorResponse('Please provide both username and role', 400));
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is project owner or admin
  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to add collaborators to this project`, 403));
  }

  // Find the user by username
  const user = await User.findOne({ username });

  if (!user) {
    return next(new ErrorResponse(`User with username ${username} not found`, 404));
  }

  // Check if user is already a collaborator
  if (project.collaborators.some(collab => collab.user.toString() === user._id.toString())) {
    return next(new ErrorResponse(`User ${username} is already a collaborator on this project`, 400));
  }

  // Add collaborator
  project.collaborators.push({
    user: user._id,
    role
  });

  await project.save();

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Remove collaborator from project
// @route   DELETE /api/v1/projects/:id/collaborators/:userId
// @access  Private
exports.removeCollaborator = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is project owner or admin, or removing themselves as collaborator
  if (project.owner.toString() !== req.user.id && 
      req.user.role !== 'admin' && 
      req.user.id !== req.params.userId) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to remove collaborators from this project`, 403));
  }

  // Remove collaborator
  project.collaborators = project.collaborators.filter(
    collab => collab.user.toString() !== req.params.userId
  );

  await project.save();

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Update project code
// @route   PUT /api/v1/projects/:id/code
// @access  Private
exports.updateProjectCode = asyncHandler(async (req, res, next) => {
  const { code, version } = req.body;

  if (!code) {
    return next(new ErrorResponse('Please provide code to update', 400));
  }

  let project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${req.params.id}`, 404));
  }
  // Check if user is authorized to edit this project
  const isCollaboratorWithEditAccess = project.collaborators.some(
    collab => collab.user.toString() === req.user.id && 
    (collab.role === 'editor' || collab.role === 'admin')
  );

  // Check if user is owner, authorized collaborator, or admin
  if (project.owner.toString() !== req.user.id && 
      !isCollaboratorWithEditAccess && 
      req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this project's code`, 403));
  }

  // Store previous code in history
  project.codeHistory.push({
    code: project.code,
    user: req.user.id,
    version: project.version
  });

  // Update code and version
  project.code = code;
  project.version = version || project.version + 1;
  project.lastActive = Date.now();

  await project.save();

  res.status(200).json({
    success: true,
    data: project
  });
});

// @desc    Update collaborator role
// @route   PUT /api/v1/projects/:id/collaborators/:userId
// @access  Private (Admin only)
exports.updateCollaboratorRole = asyncHandler(async (req, res, next) => {
  const { id, userId } = req.params;
  const { role } = req.body;
  
  if (!role || !['viewer', 'editor'].includes(role)) {
    return next(new ErrorResponse('Please provide a valid role (viewer or editor)', 400));
  }
  
  // Find project by ID
  const project = await Project.findById(id);
  
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
    // Check if user is project owner or site admin
  if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update collaborator roles', 403));
  }
  
  // Find and update collaborator role
  const collaborator = project.collaborators.find(
    collab => collab.user.toString() === userId
  );
  
  if (!collaborator) {
    return next(new ErrorResponse('Collaborator not found', 404));
  }
  
  // Update role
  collaborator.role = role;
  
  await project.save();
  
  // Send notification through WebSocket (this will be implemented in websocket.js)
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${userId}`).emit('role_updated', {
      projectId: id,
      projectName: project.name,
      role: role,
      updatedBy: req.user.name || 'Project Admin'
    });
  }
  
  res.status(200).json({
    success: true,
    data: collaborator
  });
});

// @desc    Get all collaborators for a project
// @route   GET /api/v1/projects/:id/collaborators
// @access  Private (Project members only)
exports.getProjectCollaborators = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Find project by ID with populated collaborator information
  const project = await Project.findById(id)
    .populate('owner', 'name email')
    .populate('collaborators.user', 'name email');
  
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }
  
  // Check if user has access to this project (is owner or collaborator)
  if (
    project.owner._id.toString() !== req.user.id &&
    !project.collaborators.some(collab => collab.user._id.toString() === req.user.id)
  ) {
    return next(new ErrorResponse('Not authorized to view collaborators', 403));
  }
    // Format the response with owner as admin and filter out duplicate entries
  // First create the owner entry
  const ownerEntry = {
    user: {
      _id: project.owner._id,
      name: project.owner.name,
      email: project.owner.email
    },
    role: 'admin',
    isOwner: true
  };
  
  // Then map regular collaborators, filtering out the owner
  const regularCollaborators = project.collaborators
    .filter(collab => 
      // Filter out entries where the user is the same as project owner
      collab.user._id.toString() !== project.owner._id.toString()
    )
    .map(collab => ({
      user: {
        _id: collab.user._id,
        name: collab.user.name,
        email: collab.user.email
      },
      role: collab.role,
      addedAt: collab.addedAt,
      isOwner: false
    }));
  
  const collaborators = [
    ownerEntry,
    ...regularCollaborators
  ];
    res.status(200).json({
    success: true,
    count: collaborators.length,
    data: collaborators
  });
});

// @desc    Get all sessions for a project
// @route   GET /api/v1/projects/:id/sessions
// @access  Private
exports.getProjectSessions = asyncHandler(async (req, res, next) => {
  const projectId = req.params.id;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${projectId}`, 404));
  }

  // Check if user has access to the project
  const isOwner = project.owner.toString() === req.user.id;
  const isCollaborator = project.collaborators.some(
    collab => collab.user.toString() === req.user.id
  );

  if (!isOwner && !isCollaborator && !project.isPublic) {
    return next(
      new ErrorResponse('Not authorized to access this project', 403)
    );
  }

  // Get all sessions for this project
  const sessions = await Session.find({ 
    project: projectId 
  })
  .sort({ startTime: -1 }) // Most recent first
  .populate({
    path: 'activeUsers.userId',
    select: 'name email'
  });

  // Ensure at least one active session exists or create one
  let hasActiveSession = sessions.some(session => session.isActive);
  
  // If no active sessions and at least one session exists, activate the most recent one 
  // and add current user to it
  if (!hasActiveSession && sessions.length > 0) {
    const mostRecentSession = sessions[0]; // First one because they're sorted by startTime desc
    mostRecentSession.isActive = true;
    mostRecentSession.startTime = new Date();
    
    // Check if user is already in the session
    const userAlreadyInSession = mostRecentSession.activeUsers.some(
      user => user.userId && user.userId._id && user.userId._id.toString() === req.user.id
    );
    
    if (!userAlreadyInSession) {
      // Add current user to session
      mostRecentSession.activeUsers.push({
        userId: req.user.id,
        joinedAt: new Date(),
        cursorPosition: { line: 0, column: 0 }
      });
    }
    
    await mostRecentSession.save();
  }
  // Format the sessions for frontend
  const formattedSessions = sessions.map(session => {
    // Extract latest chat messages (maximum 2 for preview)
    const chatMessagePreviews = session.chatMessages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort newest first
      .slice(0, 2)
      .map(msg => ({
        message: msg.message.length > 30 ? `${msg.message.substring(0, 30)}...` : msg.message,
        username: msg.username || 'User',
        timestamp: msg.timestamp
      }));
    
    return {
      _id: session._id,
      project: session.project,
      isActive: session.isActive,
      startTime: session.startTime,
      endTime: session.endTime,
      activeUsers: session.activeUsers.map(user => ({
        userId: user.userId,
        name: user.userId?.name || 'Unknown User',
        joinedAt: user.joinedAt
      })),
      chatMessages: session.chatMessages.length,
      chatMessagePreviews: chatMessagePreviews
    };
  });

  res.status(200).json({
    success: true,
    count: formattedSessions.length,
    data: formattedSessions
  });
});
