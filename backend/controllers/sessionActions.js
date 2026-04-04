const Session = require('../models/Session');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Join a session
// @route   POST /api/v1/sessions/:id/join
// @access  Private
exports.joinSession = asyncHandler(async (req, res, next) => {
  const sessionId = req.params.id;
  
  // Find the session
  const session = await Session.findById(sessionId);
  
  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${sessionId}`, 404));
  }
  
  // Check if session is active
  if (!session.isActive) {
    return next(new ErrorResponse('Cannot join an inactive session', 400));
  }
  
  // Check if user is already in the session
  const userIndex = session.activeUsers.findIndex(
    user => user.userId && user.userId.toString() === req.user.id
  );
  
  if (userIndex === -1) {
    // Add user to session
    session.activeUsers.push({
      userId: req.user.id,
      joinedAt: new Date(),
      cursorPosition: { line: 0, column: 0 }
    });
    
    // Save the session
    await session.save();
  } else {
    // Update user's joined time
    session.activeUsers[userIndex].joinedAt = new Date();
    await session.save();
  }
  
  // Return the updated session
  await session.populate({
    path: 'activeUsers.userId',
    select: 'name email'
  });
  
  res.status(200).json({
    success: true,
    data: {
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
      chatMessages: session.chatMessages.length
    }
  });
});

// @desc    Leave a session
// @route   POST /api/v1/sessions/:id/leave
// @access  Private
exports.leaveSession = asyncHandler(async (req, res, next) => {
  const sessionId = req.params.id;
  
  // Find the session
  const session = await Session.findById(sessionId);
  
  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${sessionId}`, 404));
  }
  
  // Remove user from active users
  const userIndex = session.activeUsers.findIndex(
    user => user.userId && user.userId.toString() === req.user.id
  );
  
  if (userIndex !== -1) {
    session.activeUsers.splice(userIndex, 1);
    await session.save();
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});
