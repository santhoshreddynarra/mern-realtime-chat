import Conversation from '../models/conversationModel.js';
import User from '../models/userModel.js';
import { emitToUser, io } from '../socket/socket.js';

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
    const convUpdate = {
      conversationId: conversation._id,
      senderId,
      receiverId: userId,
      lastMessage: '',
      lastMessageAt: conversation.createdAt,
      isNew: true
    };

    emitToUser(senderId.toString(), 'conversation:update', convUpdate);
    emitToUser(userId.toString(), 'conversation:update', convUpdate);

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

// PUT /api/conversations/:id/clear
// Clear messages for the current user
export const clearConversation = async (req, res, next) => {
  try {
    const { id: userToChatId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [userId, userToChatId] },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const existingIndex = conversation.clearedAt.findIndex(c => c.userId.toString() === userId.toString());
    if (existingIndex > -1) {
      conversation.clearedAt[existingIndex].clearedAt = new Date();
    } else {
      conversation.clearedAt.push({ userId, clearedAt: new Date() });
    }

    await conversation.save();
    res.status(200).json({ message: "Conversation cleared successfully" });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/conversations/:id
// Soft delete conversation for the current user (removes from sidebar)
export const deleteConversation = async (req, res, next) => {
  try {
    const { id: userToChatId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [userId, userToChatId] },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.deletedBy.includes(userId)) {
      conversation.deletedBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    next(error);
  }
};
