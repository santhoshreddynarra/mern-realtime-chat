import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const useConversationStore = create((set, get) => ({
  conversations: [],
  loading: false,

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
      // We also fetch immediately to ensure it's there
      get().fetchConversations();
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  },

  // Called on conversation:update socket event
  updateConversation: ({ conversationId, senderId, receiverId, lastMessage, lastMessageAt, isNew }, authUserId) => {
    const { conversations, fetchConversations } = get();
    const otherUserId = senderId.toString() === authUserId ? receiverId : senderId;

    const exists = conversations.find((c) => c._id.toString() === otherUserId.toString());
    
    if (!exists || isNew) {
      // If it's a new conversation we don't have in state, just refetch to get populated user data
      fetchConversations();
      return;
    }

    const updated = conversations.map((c) => {
      if (c._id.toString() === otherUserId.toString()) {
        return { ...c, lastMessage, lastMessageAt, updatedAt: new Date().toISOString() };
      }
      return c;
    });

    updated.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0);
      const dateB = new Date(b.updatedAt || 0);
      return dateB - dateA;
    });

    set({ conversations: updated });
  },
}));
