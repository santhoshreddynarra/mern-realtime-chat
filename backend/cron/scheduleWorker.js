import cron from 'node-cron';
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

const startScheduleWorker = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      const messages = await Message.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      });

      if (messages.length === 0) return;

      for (const message of messages) {
        message.status = 'sent';
        await message.save();

        if (message.replyTo) {
          await message.populate('replyTo', 'message senderId');
        }

        const conversation = await Conversation.findOne({
          messages: message._id
        });

        if (conversation) {
          conversation.lastMessage = message.message;
          conversation.lastMessageAt = new Date();
          await conversation.save();

          const senderSocketId = getReceiverSocketId(message.senderId.toString());
          const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

          // Deliver to receiver instantly
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', message);
          }

          // Notify sender so their UI changes from clock to tick
          if (senderSocketId) {
            io.to(senderSocketId).emit('message:sent', message);
          }

          const convUpdate = {
            conversationId: conversation._id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            lastMessage: message.message,
            lastMessageAt: conversation.lastMessageAt,
          };

          if (senderSocketId) io.to(senderSocketId).emit('conversation:update', convUpdate);
          if (receiverSocketId) io.to(receiverSocketId).emit('conversation:update', convUpdate);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  });
};

export default startScheduleWorker;
