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

  // Called when a user is selected from search results — ensures they appear in sidebar
  ensureConversation: (user) => {
    const { conversations } = get();
    const exists = conversations.find((c) => c._id === user._id);
    if (!exists) {
      // Prepend as a "pending" conversation with no lastMessage yet
      set({
        conversations: [
          {
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            phone: user.phone,
            profilePic: user.profilePic,
            about: user.about,
            lastMessage: '',
            lastMessageAt: null,
          },
          ...conversations,
        ],
      });
    }
  },

  // Called on conversation:update socket event
  updateConversation: ({ conversationId, senderId, receiverId, lastMessage, lastMessageAt }, authUserId) => {
    const { conversations } = get();
    // The "other" user in this conversation from our perspective
    const otherUserId = senderId.toString() === authUserId ? receiverId : senderId;

    const updated = conversations.map((c) => {
      if (c._id.toString() === otherUserId.toString()) {
        return { ...c, lastMessage, lastMessageAt };
      }
      return c;
    });

    // Sort by lastMessageAt descending
    updated.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(a.createdAt || 0);
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    set({ conversations: updated });
  },
}));
