import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import { app, server } from './socket/socket.js';
import startScheduleWorker from './cron/scheduleWorker.js';

dotenv.config();

const port = process.env.PORT || 5000;

// Connect Database
connectDB();

// Start Scheduled Jobs
startScheduleWorker();

// =======================
// CORS Configuration
// =======================
app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')
      : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// =======================
// Middleware
// =======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// =======================
// Health Routes
// =======================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MERN Chat API is running 🚀',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
  });
});

// =======================
// API Routes
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// =======================
// Error Handling
// =======================
app.use(notFound);
app.use(errorHandler);

// =======================
// Start Server
// =======================
server.listen(port, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`
  );
});