const express = require('express');
const { check } = require('express-validator');
const { 
  register, 
  login, 
  getMe, 
  logout,
  updateDetails,
  updatePassword,
  forgotPassword,
  validateResetToken,
  resetPassword,
  deleteAccount
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  register
);

// Login user
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

// Get current user
router.get('/me', protect, getMe);

// Logout user
router.get('/logout', protect, logout);

// Update user details
router.put('/updatedetails', protect, updateDetails);

// Update password
router.put(
  '/updatepassword',
  [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  protect,
  updatePassword
);

// Forgot password
router.post('/forgotpassword', forgotPassword);

// Validate reset token
router.get('/resetpassword/:token', validateResetToken);

// Reset password
router.put(
  '/resetpassword/:token',
  [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  resetPassword
);

// Delete account
router.post(
  '/delete',
  [
    check('password', 'Password is required to delete your account').exists()
  ],
  protect,
  deleteAccount
);

module.exports = router;
