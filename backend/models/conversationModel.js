import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    }
  ],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageSenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lastMessageAt: {
    type: Date,
    default: null,
  },
  clearedAt: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      clearedAt: { type: Date }
    }
  ],
  deletedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
