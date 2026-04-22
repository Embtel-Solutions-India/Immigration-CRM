const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  team:         { type: String, enum: ['Sales', 'Marketing', 'Production'], required: true },
  isActive:     { type: Boolean, default: true },
  refreshTokenHash: { type: String },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ team: 1, role: 1 });

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
