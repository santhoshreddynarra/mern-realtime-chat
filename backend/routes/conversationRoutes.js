import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createOrGetConversation } from '../controllers/conversationController.js';

const router = express.Router();

router.post('/', protect, createOrGetConversation);

export default router;
