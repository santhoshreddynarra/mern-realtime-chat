import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createOrGetConversation, clearConversation, deleteConversation } from '../controllers/conversationController.js';

const router = express.Router();

router.post('/', protect, createOrGetConversation);
router.put('/:id/clear', protect, clearConversation);
router.delete('/:id', protect, deleteConversation);

export default router;
