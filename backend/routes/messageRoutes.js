import express from 'express';
import { sendMessage, getMessages, markMessagesAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});
const router = express.Router();

router.get('/:id', protect, getMessages);
router.post('/send/:id', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, sendMessage);
router.put('/read/:id', protect, markMessagesAsRead);

export default router;
