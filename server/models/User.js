const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['user', 'admin', 'hr_user', 'hr_admin', 'hr', 'superadmin'], default: 'user' },
  team: {
    type: String,
    enum: ['Sales', 'Marketing', 'Production', 'HR'],
    required: function teamRequired() {
      return this.role !== 'superadmin' && this.role !== 'hr';
    },
  },
  isActive:     { type: Boolean, default: true },
  refreshTokenHash: { type: String },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ team: 1, role: 1 });

userSchema.pre('validate', function enforceTeamRules(next) {
  if (this.role === 'hr') {
    this.role = 'hr_admin';
  }
  if (this.role === 'superadmin') {
    this.team = undefined;
  } else if (this.role === 'hr_admin' || this.role === 'hr_user') {
    this.team = 'HR';
  }
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  if (obj.role === 'superadmin') {
    delete obj.team;
  }
  return obj;
};

module.exports = mongoose.model('User', userSchema);
