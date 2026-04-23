const Notification = require('../models/Notification');

exports.getForUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (req.user.role === 'user' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (e) { next(e); }
};

exports.getMine = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (e) { next(e); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.markUnread = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: false }
    );
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const n = await Notification.create(req.body);
    res.status(201).json(n);
  } catch (e) { next(e); }
};

exports.createInternal = async (userId, type, title, message, linkTo = '') => {
  try {
    await Notification.create({ userId, type, title, message, linkTo });
  } catch (e) {
    console.error('Notification creation failed:', e.message);
  }
};
