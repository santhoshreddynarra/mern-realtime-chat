import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getUsersForSidebar, searchUsers, updateProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/', protect, getUsersForSidebar);
router.get('/search', protect, searchUsers);
router.put('/profile', protect, updateProfile);

export default router;
