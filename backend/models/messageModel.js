import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    default: ""
  },
  audio: {
    type: String,
    default: ""
  },
  audioDuration: {
    type: Number,
    default: 0
  },
  audioSize: {
    type: Number,
    default: 0
  },
  audioFormat: {
    type: String,
    default: ""
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'scheduled'],
    default: 'sent'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
