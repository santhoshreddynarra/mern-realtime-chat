import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  username:   { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone:      { type: String, unique: true, sparse: true, trim: true },
  password:   { type: String, required: true },
  profilePic: { type: String, default: '' },
  about:      { type: String, default: 'Hey there! I am using MERN Chat.' },
  lastSeen:   { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
