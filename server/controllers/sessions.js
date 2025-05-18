const Session = require('../models/Session');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a new session
// @route   POST /api/v1/sessions
// @access  Private
exports.createSession = asyncHandler(async (req, res, next) => {
  const { projectId } = req.body;

  if (!projectId) {
    return next(new ErrorResponse('Please provide a projectId', 400));
  }

  // Check if project exists
  const project = await Project.findById(projectId);

  if (!project) {
    return next(new ErrorResponse(`Project not found with id of ${projectId}`, 404));
  }
  // Check if user is authorized to create a session for this project
  const isOwner = project.owner.toString() === req.user.id;
  const isCollaborator = project.collaborators.some(
    collab => collab.user.toString() === req.user.id
  );

  if (!isOwner && !isCollaborator && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to create a session for this project`, 403));
  }
  
  // If user is owner but not in collaborators list with admin role, add them
  if (isOwner) {
    const ownerCollaborator = project.collaborators.find(
      collab => collab.user.toString() === req.user.id
    );
    
    if (!ownerCollaborator) {
      project.collaborators.push({
        user: req.user.id,
        role: 'admin',
        addedAt: Date.now()
      });
      await project.save();
    } else if (ownerCollaborator.role !== 'admin') {
      ownerCollaborator.role = 'admin';
      await project.save();
    }
  }

  // Check if there's already an active session
  let session = await Session.findOne({ 
    project: projectId,
    isActive: true 
  });

  if (session) {
    // Add user to existing session if not already present
    const existingUser = session.activeUsers.find(
      user => user.userId.toString() === req.user.id
    );

    if (!existingUser) {
      session.activeUsers.push({
        userId: req.user.id,
        cursorPosition: { line: 0, column: 0 }
      });

      session = await session.save();
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  }

  // Create new session
  session = await Session.create({
    project: projectId,
    activeUsers: [{
      userId: req.user.id,
      cursorPosition: { line: 0, column: 0 }
    }]
  });

  res.status(201).json({
    success: true,
    data: session
  });
});

// @desc    Get all active sessions
// @route   GET /api/v1/sessions
// @access  Private
exports.getSessions = asyncHandler(async (req, res, next) => {
  let query;

  // For regular users, only show sessions they are part of
  if (req.user.role !== 'admin') {
    query = Session.find({
      isActive: true,
      'activeUsers.userId': req.user.id
    });
  } else {
    // Admins can see all active sessions
    query = Session.find({ isActive: true });
  }

  query = query.populate({
    path: 'project',
    select: 'name language owner collaborators'
  }).populate({
    path: 'activeUsers.userId',
    select: 'username firstName lastName profilePicture'
  });

  const sessions = await query;

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions
  });
});

// @desc    Get single session
// @route   GET /api/v1/sessions/:id
// @access  Private
exports.getSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)
    .populate({
      path: 'project',
      select: 'name language code owner collaborators'
    })
    .populate({
      path: 'activeUsers.userId',
      select: 'username firstName lastName profilePicture'
    });

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404));
  }

  // Check if user is part of this session or is admin
  const isActiveUser = session.activeUsers.some(
    user => user.userId._id.toString() === req.user.id
  );

  const isProjectOwnerOrCollaborator = 
    session.project.owner.toString() === req.user.id ||
    session.project.collaborators.some(collab => collab.user.toString() === req.user.id);

  if (!isActiveUser && !isProjectOwnerOrCollaborator && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this session`, 403));
  }

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    End a session
// @route   PUT /api/v1/sessions/:id/end
// @access  Private
exports.endSession = asyncHandler(async (req, res, next) => {
  let session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404));
  }

  // Load project to check ownership
  const project = await Project.findById(session.project);

  if (!project) {
    return next(new ErrorResponse(`Project associated with this session not found`, 404));
  }

  // Check if user is project owner, admin, or last user in session
  const isProjectOwner = project.owner.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isProjectOwner && !isAdmin) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to end this session`, 403));
  }

  session.isActive = false;
  session.endTime = Date.now();
  
  await session.save();

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Add message to session chat
// @route   POST /api/v1/sessions/:id/chat
// @access  Private
exports.addChatMessage = asyncHandler(async (req, res, next) => {
  const { message } = req.body;

  if (!message) {
    return next(new ErrorResponse('Please provide a message', 400));
  }

  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404));
  }

  // Check if user is part of this session
  const isActiveUser = session.activeUsers.some(
    user => user.userId.toString() === req.user.id
  );

  if (!isActiveUser && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to chat in this session`, 403));
  }

  // Add message to chat
  session.chatMessages.push({
    userId: req.user.id,
    username: req.user.username,
    message
  });

  await session.save();

  res.status(200).json({
    success: true,
    data: session.chatMessages[session.chatMessages.length - 1]
  });
});

// @desc    Get chat messages from a session
// @route   GET /api/v1/sessions/:id/chat
// @access  Private
exports.getChatMessages = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)
    .select('chatMessages')
    .populate({
      path: 'chatMessages.userId',
      select: 'username firstName lastName profilePicture'
    });

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404));
  }

  // Check if user is part of this session or project owner/collaborator
  const project = await Project.findById(session.project);
  
  const isActiveUser = session.activeUsers.some(
    user => user.userId.toString() === req.user.id
  );

  const isProjectOwnerOrCollaborator = 
    project.owner.toString() === req.user.id ||
    project.collaborators.some(collab => collab.user.toString() === req.user.id);

  if (!isActiveUser && !isProjectOwnerOrCollaborator && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access chat messages for this session`, 403));
  }

  res.status(200).json({
    success: true,
    count: session.chatMessages.length,
    data: session.chatMessages
  });
});
