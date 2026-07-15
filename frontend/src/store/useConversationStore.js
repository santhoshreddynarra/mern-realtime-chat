import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const useConversationStore = create((set, get) => ({
  conversations: [],
  loading: false,
  _socketListener: null,

  fetchConversations: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get('/users');
      set({ conversations: res.data });
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      set({ loading: false });
    }
  },

  createConversation: async (user) => {
    try {
      await axiosInstance.post('/conversations', { userId: user._id });
      get().fetchConversations();
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  },

  resetUnreadCount: (userId) => {
    set((state) => ({
      conversations: state.conversations.map((c) => 
        c._id.toString() === userId.toString() ? { ...c, unreadCount: 0 } : c
      )
    }));
  },

  // Wire up the socket listener for conversation:update.
  // Called once from App.jsx after socket connects.
  listenForConversationUpdates: (socket, authUserId) => {
    const { _socketListener } = get();

    // Clean up any previous listener first (guard against re-registration)
    if (_socketListener) {
      _socketListener.socket.off('conversation:update', _socketListener.handler);
    }

    const handler = ({ conversationId, senderId, receiverId, lastMessage, lastMessageSenderId, lastMessageAt, isNew }) => {
      const { conversations, fetchConversations } = get();
      const otherUserId = senderId.toString() === authUserId.toString() ? receiverId.toString() : senderId.toString();

      const existsIdx = conversations.findIndex((c) => c._id.toString() === otherUserId);

      if (existsIdx === -1 || isNew) {
        // New conversation not yet in local state — refetch
        fetchConversations();
        return;
      }

      const updated = conversations.map((c) => {
        if (c._id.toString() === otherUserId) {
          // Increment unreadCount if we are the receiver and this is a new message update
          const isReceiver = authUserId.toString() === receiverId.toString();
          return { 
            ...c, 
            lastMessage,
            lastMessageSenderId,
            lastMessageAt, 
            updatedAt: new Date().toISOString(),
            unreadCount: isReceiver ? (c.unreadCount || 0) + 1 : c.unreadCount
          };
        }
        return c;
      });

      updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

      set({ conversations: updated });
    };

    socket.on('conversation:update', handler);
    set({ _socketListener: { socket, handler } });
  },

  cleanupConversationUpdates: () => {
    const { _socketListener } = get();
    if (_socketListener) {
      _socketListener.socket.off('conversation:update', _socketListener.handler);
      set({ _socketListener: null });
    }
  },

  // Legacy: kept for any residual callers
  updateConversation: ({ conversationId, senderId, receiverId, lastMessage, lastMessageAt, isNew }, authUserId) => {
    get().listenForConversationUpdates; // no-op legacy shim
  },
}));
