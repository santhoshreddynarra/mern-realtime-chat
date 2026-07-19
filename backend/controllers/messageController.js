import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import { emitToUser, io } from '../socket/socket.js';
export const sendMessage = async (req, res, next) => {
  try {
    const { message, replyTo, scheduledFor } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

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
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: scheduledFor ? 'scheduled' : 'sent',
    });

    conversation.messages.push(newMessage._id);
    conversation.deletedBy = [];

    if (!scheduledFor) {
      conversation.lastMessage = message;
      conversation.lastMessageSenderId = senderId;
      conversation.lastMessageAt = new Date();
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    if (newMessage.replyTo) {
      await newMessage.populate('replyTo', 'message senderId');
    }

    if (scheduledFor) {
      emitToUser(senderId.toString(), 'newMessage', newMessage);
    } else {
      emitToUser(receiverId, 'newMessage', newMessage);

      const convUpdate = {
        conversationId: conversation._id,
        senderId,
        receiverId,
        lastMessage: message,
        lastMessageSenderId: senderId,
        lastMessageAt: conversation.lastMessageAt,
      };

      emitToUser(senderId.toString(), 'conversation:update', convUpdate);
      emitToUser(receiverId, 'conversation:update', convUpdate);
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

    const userClearData = conversation.clearedAt.find(c => c.userId.toString() === senderId.toString());
    const clearTime = userClearData ? userClearData.clearedAt : null;

    const filteredMessages = conversation.messages.filter(msg => {
      if (clearTime && new Date(msg.createdAt) <= new Date(clearTime)) return false;
      return msg.status !== 'scheduled' || msg.senderId.toString() === senderId.toString();
    });

    res.status(200).json(filteredMessages);
  } catch (error) {
    next(error);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId, status: { $in: ['sent', 'delivered'] } },
      { $set: { status: 'read' } }
    );

    emitToUser(senderId, 'messages:read', { readerId: receiverId });

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};
