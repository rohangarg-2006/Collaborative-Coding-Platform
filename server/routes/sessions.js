const express = require('express');
const {
  createSession,
  getSessions,
  getSession,
  endSession,
  addChatMessage,
  getChatMessages
} = require('../controllers/sessions');

const {
  joinSession,
  leaveSession
} = require('../controllers/sessionActions');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getSessions)
  .post(createSession);

router
  .route('/:id')
  .get(getSession);

router.put('/:id/end', endSession);

// Session joining/leaving routes
router.post('/:id/join', joinSession);
router.post('/:id/leave', leaveSession);

router
  .route('/:id/chat')
  .get(getChatMessages)
  .post(addChatMessage);

module.exports = router;
