import { create } from 'zustand';
import { io } from 'socket.io-client';

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  offlineUsers: {},

  connectSocket: () => {
    const { socket } = get();

    // Prevent duplicate connections
    if (socket && socket.connected) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || "/", {
      transports: ["websocket"],
      withCredentials: true,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    newSocket.on("getOnlineUsers", (users) => {
      set({ onlineUsers: users });
    });

    newSocket.on("user:offline", ({ userId, lastSeen }) => {
      set((state) => ({
        offlineUsers: {
          ...state.offlineUsers,
          [userId]: lastSeen,
        },
      }));
    });
  },

  disconnectSocket: () => {
    const { socket } = get();

    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        onlineUsers: [],
      });
    }
  },
}));