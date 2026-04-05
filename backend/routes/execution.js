const express = require('express');
const { getRuntimes, executeCode } = require('../controllers/execution');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/runtimes', getRuntimes);
router.post('/execute', executeCode);

module.exports = router;
