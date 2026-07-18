import express from 'express';
import { sendMessage, sendVoiceMessage, getMessages, markMessagesAsRead } from '../controllers/messageController.js';
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

const uploadVoice = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio is allowed.'), false);
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

router.post('/send-voice/:id', protect, (req, res, next) => {
  uploadVoice.single('audio')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, sendVoiceMessage);

router.put('/read/:id', protect, markMessagesAsRead);

export default router;
