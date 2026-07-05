import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const protect = async (req, res, next) => {
  let token = req.cookies.jwt; // Needs cookie-parser to work

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
      next();
    } catch (error) {
      res.status(401);
      next(new Error('Not authorized, invalid token'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};
