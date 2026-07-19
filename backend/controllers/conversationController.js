import Conversation from '../models/conversationModel.js';
import { emitToUser } from '../socket/socket.js';

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

    const conversationKey = [senderId.toString(), userId.toString()].sort().join("_");

    try {
      const result = await Conversation.findOneAndUpdate(
        { conversationKey },
        {
          $setOnInsert: { participants: [senderId, userId] }
        },
        { upsert: true, new: true, includeResultMetadata: true }
      );

      const doc = result.value || result;
      const isNew = result.lastErrorObject ? !result.lastErrorObject.updatedExisting : (doc.createdAt.getTime() === doc.updatedAt.getTime());

      await doc.populate('participants', '-password');

      if (isNew) {
        const convUpdate = {
          conversationId: doc._id,
          senderId: senderId.toString(),
          receiverId: userId.toString(),
          lastMessage: '',
          lastMessageAt: doc.createdAt,
          isNew: true
        };

        emitToUser(senderId.toString(), 'conversation:update', convUpdate);
        emitToUser(userId.toString(), 'conversation:update', convUpdate);

        return res.status(201).json(doc);
      } else {
        return res.status(200).json(doc);
      }
    } catch (error) {
      if (error.code === 11000) {
        const existingConv = await Conversation.findOne({ conversationKey }).populate('participants', '-password');
        return res.status(200).json(existingConv);
      }
      throw error;
    }
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

    const conversationKey = [userId.toString(), userToChatId.toString()].sort().join("_");

    const conversation = await Conversation.findOne({
      conversationKey,
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

    const conversationKey = [userId.toString(), userToChatId.toString()].sort().join("_");

    const conversation = await Conversation.findOne({
      conversationKey,
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
