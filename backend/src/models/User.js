const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycData: { type: mongoose.Schema.Types.Mixed },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  refreshToken: { type: String },
  resetToken: String, resetExpires: Date, emailVerificationToken: String,
  createdAt: { type: Date, default: Date.now }, lastLogin: Date, stealthEnabled: { type: Boolean, default: false }
});
userSchema.pre('save', async function(next) { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = async function(candidate) { return bcrypt.compare(candidate, this.password); };
module.exports = mongoose.model('User', userSchema);
