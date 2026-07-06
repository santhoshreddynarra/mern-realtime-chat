import express from 'express';
import { sendMessage, getMessages, markMessagesAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, sendMessage);
router.put('/read/:id', protect, markMessagesAsRead);

export default router;
