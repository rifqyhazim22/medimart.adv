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

// Image upload for chat
const upload = require('../middlewares/upload');
router.post('/api/chat/upload-image', upload.single('chat_image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = '/' + req.file.path.replace(/^public[\\/]/, '');
    res.json({ success: true, image_url: imageUrl });
});

module.exports = router;
