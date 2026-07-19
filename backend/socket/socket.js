import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// ─── Socket.IO JWT Authentication Middleware ──────────────────────────────────
// Reads the httpOnly jwt cookie from the WebSocket upgrade request headers,
// verifies it, and attaches socket.userId. Rejects unauthenticated connections.
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || '';

    // Parse cookie string: "key=val; key2=val2" → { key: val, key2: val2 }
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      }).filter(([k]) => k)
    );

    const token = cookies.jwt;
    if (!token) {
      return next(new Error('Unauthorized: no token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Unauthorized: invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId; // Verified server-side — never trust query params

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('typing:start', ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:start', { senderId: userId });
    }
  });

  socket.on('typing:stop', ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stop', { senderId: userId });
    }
  });

  socket.on('message:delivered', async ({ messageId, senderId }) => {
    // Prevent spoofing: only allow delivery receipts where the socket owner is the actual receiver
    const msg = await Message.findById(messageId).select('receiverId');
    if (!msg || msg.receiverId.toString() !== userId) return;

    await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message:delivered', { messageId });
    }
  });

  socket.on('disconnect', async () => {
    if (userId) {
      delete userSocketMap[userId];
      const lastSeenTime = new Date();
      await User.findByIdAndUpdate(userId, { lastSeen: lastSeenTime });
      io.emit('user:offline', { userId, lastSeen: lastSeenTime });
    }
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

export { app, io, server };
