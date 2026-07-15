import { create } from 'zustand';
import { io } from 'socket.io-client';

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  offlineUsers: {},

  connectSocket: (userId) => {
    const { socket } = get();
    // Guard: don't create a new socket if one is already connected for this user
    if (socket && socket.connected) return;

    const newSocket = io('http://localhost:5000', {
      query: { userId },
      transports: ['websocket'], // Skip polling to prevent duplicate connection races
    });

    set({ socket: newSocket });

    newSocket.on('getOnlineUsers', (users) => {
      set({ onlineUsers: users });
    });

    newSocket.on('user:offline', ({ userId, lastSeen }) => {
      set((state) => ({
        offlineUsers: { ...state.offlineUsers, [userId]: lastSeen }
      }));
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
