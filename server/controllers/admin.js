// Admin controller for maintenance tasks
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const inviteCodeManager = require('../utils/inviteCodeManager');

/**
 * @desc    Fix missing invite codes for all projects
 * @route   POST /api/v1/admin/fix-invite-codes
 * @access  Private/Admin
 */
exports.fixInviteCodes = asyncHandler(async (req, res, next) => {
  // This route should only be accessible to administrators
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this route', 403));
  }

  const result = await inviteCodeManager.ensureAllProjectsHaveInviteCodes();
  
  if (!result.success) {
    return next(new ErrorResponse('Error fixing invite codes: ' + result.error, 500));
  }

  res.status(200).json({
    success: true,
    message: `Fixed ${result.count} projects with missing invite codes`,
    data: result
  });
});
