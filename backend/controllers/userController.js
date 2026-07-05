import User from '../models/userModel.js';

export const getUsersForSidebar = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(allUsers);
  } catch (error) {
    next(error);
  }
};
