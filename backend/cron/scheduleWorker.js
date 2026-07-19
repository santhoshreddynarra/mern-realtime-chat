import cron from 'node-cron';
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import { emitToUser, io } from '../socket/socket.js';

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

          // Deliver to receiver instantly (all active tabs)
          emitToUser(message.receiverId.toString(), 'newMessage', message);

          // Notify sender so their UI changes from clock to tick (all active tabs)
          emitToUser(message.senderId.toString(), 'message:sent', message);

          const convUpdate = {
            conversationId: conversation._id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            lastMessage: message.message,
            lastMessageAt: conversation.lastMessageAt,
          };

          emitToUser(message.senderId.toString(), 'conversation:update', convUpdate);
          emitToUser(message.receiverId.toString(), 'conversation:update', convUpdate);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  });
};

export default startScheduleWorker;
