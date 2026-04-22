const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (password) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { team: req.user.team } : {};
    const users = await User.find(filter, '-passwordHash -refreshTokenHash').sort({ name: 1 });
    res.json(users);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id, '-passwordHash -refreshTokenHash');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, team, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (team !== undefined) updates.team = team;
    if (isActive !== undefined) updates.isActive = isActive;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toSafeObject());
  } catch (e) { next(e); }
};
