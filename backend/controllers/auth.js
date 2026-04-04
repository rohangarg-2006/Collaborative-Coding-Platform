const { validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { sendTokenResponse } = require('../utils/tokenManager');

// @desc    Register a user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { username, email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new ErrorResponse('Email already in use', 400));
    } else {
      return next(new ErrorResponse('Username already taken', 400));
    }
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName
  });

  // Send token response
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Email is required', 400));
  }

  const user = await User.findOne({ email });

  // Don't tell the client if the email exists or not for security reasons
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent'
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

  // Email message
  const message = `You are receiving this email because you (or someone else) has requested a password reset for your account. Please visit: \n\n ${resetUrl} \n\nThis link is valid for 10 minutes.`;

  try {
    // In a production environment, you would implement an email service here
    // For now, we'll just log the token and reset URL
    console.log('RESET TOKEN:', resetToken);
    console.log('RESET URL:', resetUrl);
    console.log('EMAIL MESSAGE:', message);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent',
      // For development - remove in production
      resetUrl,
      resetToken
    });
  } catch (err) {
    console.error('Email sending error:', err);
    
    // If email fails, clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Validate reset token
// @route   GET /api/v1/auth/resetpassword/:token
// @access  Public
exports.validateResetToken = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = req.params.token;

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  res.status(200).json({
    success: true,
    message: 'Token is valid'
  });
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = req.params.token;

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    username: req.body.username,
    bio: req.body.bio
  };

  // Filter out undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  // Check if the username is being changed and is already taken
  if (fieldsToUpdate.username && fieldsToUpdate.username !== req.user.username) {
    const existingUser = await User.findOne({ username: fieldsToUpdate.username });
    if (existingUser) {
      return next(new ErrorResponse('Username already taken', 400));
    }
  }

  // Check if the email is being changed and is already in use
  if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
    const existingUser = await User.findOne({ email: fieldsToUpdate.email });
    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(req.body.currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Delete user account
// @route   POST /api/v1/auth/delete
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new ErrorResponse('Password is required to delete account', 400));
  }

  // Get user with password field
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid password', 401));
  }

  // Delete user
  await User.findByIdAndDelete(user._id);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});
