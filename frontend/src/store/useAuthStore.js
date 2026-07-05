import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  authUser: JSON.parse(localStorage.getItem('chat-user')) || null,

  signup: async (data) => {
    try {
      const res = await axiosInstance.post('/auth/register', data);
      localStorage.setItem('chat-user', JSON.stringify(res.data));
      set({ authUser: res.data });
      toast.success('Account created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating account');
    }
  },

  login: async (data) => {
    try {
      const res = await axiosInstance.post('/auth/login', data);
      localStorage.setItem('chat-user', JSON.stringify(res.data));
      set({ authUser: res.data });
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      localStorage.removeItem('chat-user');
      set({ authUser: null });
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  }
}));
