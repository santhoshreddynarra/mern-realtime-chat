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
    required: function() { return !this.image; }
  },
  image: {
    type: String,
    default: ""
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
