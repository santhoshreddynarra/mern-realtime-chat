import Conversation from '../models/conversationModel.js';
import User from '../models/userModel.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

// POST /api/conversations
// Create or get conversation between logged-in user and target user
export const createOrGetConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const senderId = req.user._id;

    if (!userId) {
      res.status(400);
      throw new Error('User ID is required');
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, userId] },
    }).populate('participants', '-password');

    if (conversation) {
      return res.status(200).json(conversation);
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [senderId, userId],
    });

    conversation = await conversation.populate('participants', '-password');

    // Notify both users via Socket.IO
    const senderSocketId = getReceiverSocketId(senderId.toString());
    const receiverSocketId = getReceiverSocketId(userId.toString());

    const convUpdate = {
      conversationId: conversation._id,
      senderId,
      receiverId: userId,
      lastMessage: '',
      lastMessageAt: conversation.createdAt,
      isNew: true
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit('conversation:update', convUpdate);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('conversation:update', convUpdate);
    }

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};
