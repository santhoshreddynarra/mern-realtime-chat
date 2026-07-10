import User from '../models/userModel.js';
import Conversation from '../models/conversationModel.js';

// GET /api/users  — sidebar: conversations sorted by latest activity
export const getUsersForSidebar = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all conversations the logged-in user participates in, sorted by last activity
    const conversations = await Conversation.find({
      participants: loggedInUserId,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', '-password');

    // Shape the response: return the "other" participant with conversation meta
    const result = conversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== loggedInUserId.toString()
      );
      return {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        username: otherUser.username,
        phone: otherUser.phone,
        profilePic: otherUser.profilePic,
        about: otherUser.about,
        conversationId: conv._id,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/search?q=...  — discover users by name, username, or phone
export const searchUsers = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    const query = req.query.q?.trim();

    if (!query || query.length < 1) {
      return res.status(200).json([]);
    }

    const regex = new RegExp(query, 'i');

    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { name: regex },
        { username: regex },
        { phone: regex },
      ],
    })
      .select('-password')
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
