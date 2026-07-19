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

// Maps userId → Set of active socket IDs (supports multiple tabs/browsers per user)
const userSocketMap = {};

/**
 * Emit an event to ALL active sockets belonging to a user.
 * Returns true if at least one socket was found.
 */
export const emitToUser = (userId, event, data) => {
  const socketIds = userSocketMap[userId];
  if (!socketIds || socketIds.size === 0) return false;
  socketIds.forEach(socketId => io.to(socketId).emit(event, data));
  return true;
};

/**
 * @deprecated Use emitToUser() instead.
 * Kept for backwards-compatibility; returns the first active socket ID or undefined.
 */
export const getReceiverSocketId = (userId) => {
  const socketIds = userSocketMap[userId];
  if (!socketIds || socketIds.size === 0) return undefined;
  return socketIds.values().next().value;
};

// ─── Socket.IO JWT Authentication Middleware ──────────────────────────────────
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || '';

    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      }).filter(([k]) => k)
    );

    const token = cookies.jwt;
    if (!token) return next(new Error('Unauthorized: no token'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Unauthorized: invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;

  if (userId) {
    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
  }

  // Broadcast updated online user list
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('typing:start', ({ receiverId }) => {
    emitToUser(receiverId, 'typing:start', { senderId: userId });
  });

  socket.on('typing:stop', ({ receiverId }) => {
    emitToUser(receiverId, 'typing:stop', { senderId: userId });
  });

  socket.on('message:delivered', async ({ messageId, senderId }) => {
    // Only the verified socket owner (actual receiver) can mark delivered
    const msg = await Message.findById(messageId).select('receiverId');
    if (!msg || msg.receiverId.toString() !== userId) return;

    await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
    emitToUser(senderId, 'message:delivered', { messageId });
  });

  socket.on('disconnect', async () => {
    if (!userId) return;

    // Remove only this specific socket from the user's set
    if (userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);

      // Only mark offline when the user has NO remaining active tabs
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
        const lastSeenTime = new Date();
        await User.findByIdAndUpdate(userId, { lastSeen: lastSeenTime });
        io.emit('user:offline', { userId, lastSeen: lastSeenTime });
      }
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

export { app, io, server };
