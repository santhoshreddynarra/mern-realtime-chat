import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { message, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let newMessage = new Message({
      senderId,
      receiverId,
      message,
      replyTo: replyTo || null,
    });

    conversation.messages.push(newMessage._id);
    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();

    await Promise.all([conversation.save(), newMessage.save()]);

    if (newMessage.replyTo) {
      await newMessage.populate('replyTo', 'message senderId');
    }

    // Emit new message to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    // Emit conversation update to BOTH participants so their sidebars refresh
    const convUpdate = {
      conversationId: conversation._id,
      senderId,
      receiverId,
      lastMessage: message,
      lastMessageAt: conversation.lastMessageAt,
    };

    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit('conversation:update', convUpdate);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('conversation:update', convUpdate);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate({
      path: 'messages',
      populate: { path: 'replyTo', select: 'message senderId' }
    });

    if (!conversation) return res.status(200).json([]);

    res.status(200).json(conversation.messages);
  } catch (error) {
    next(error);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId, status: 'sent' },
      { $set: { status: 'read' } }
    );

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('messages:read', { readerId: receiverId });
    }

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};
