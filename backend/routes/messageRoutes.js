import express from 'express';
import { sendMessage, getMessages, markMessagesAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, upload.single('image'), sendMessage);
router.put('/read/:id', protect, markMessagesAsRead);

export default router;
