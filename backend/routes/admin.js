const express = require('express');
const { fixInviteCodes } = require('../controllers/admin');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin route to fix invite codes for all projects
router.post('/fix-invite-codes', fixInviteCodes);

module.exports = router;
