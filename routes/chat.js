const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { isAuthenticated } = require('../middlewares/auth');

// All chat routes require login
router.use(isAuthenticated);

// Chat inbox
router.get('/chat', chatController.inbox);

// Start or find a conversation
router.post('/chat/start', chatController.startChat);

// API: get unread count
router.get('/api/chat/unread', chatController.getUnreadCount);

// Chat room (must be after /chat/start to avoid route conflict)
router.get('/chat/:conversationId', chatController.chatRoom);

module.exports = router;
