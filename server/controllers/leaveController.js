const LeaveRequest = require('../models/LeaveRequest');
const { createInternal } = require('./notificationController');
const logAudit = require('../utils/auditLogger');

exports.request = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.create({ ...req.body, userId: req.user._id });
    await logAudit(req, 'leave_requested', 'LeaveRequest', leave._id, null, { dates: leave.dates });
    res.status(201).json(leave);
  } catch (e) { next(e); }
};

exports.review = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewNote, reviewedBy: req.user._id },
      { new: true }
    ).populate('userId', 'name');

    if (!leave) return res.status(404).json({ error: 'Not found' });

    await createInternal(
      leave.userId._id,
      'leave_update',
      `Leave request ${status.toLowerCase()}`,
      `Your leave request for ${leave.dates.length} day(s) has been ${status.toLowerCase()}.${reviewNote ? ' Note: ' + reviewNote : ''}`,
      '/leave'
    );

    await logAudit(req, `leave_${status.toLowerCase()}`, 'LeaveRequest', leave._id, null, { status });
    res.json(leave);
  } catch (e) { next(e); }
};

exports.teamCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const User = require('../models/User');
    const teamFilter = req.user.role === 'admin' ? { team: req.user.team } : {};
    const users = await User.find({ ...teamFilter, isActive: true }, '_id name team');
    const userIds = users.map(u => u._id);

    const leaves = await LeaveRequest.find({
      userId: { $in: userIds },
      status: 'Approved',
      dates: { $elemMatch: { $gte: start, $lte: end } },
    }).populate('userId', 'name team');

    res.json(leaves);
  } catch (e) { next(e); }
};

exports.userHistory = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const leaves = await LeaveRequest.find({ userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};

exports.getAll = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({})
      .populate('userId', 'name team')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};

exports.getPending = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { status: 'Pending' }
      : { status: 'Pending' };

    if (req.user.role === 'admin') {
      const User = require('../models/User');
      const teamUsers = await User.find({ team: req.user.team }, '_id');
      filter.userId = { $in: teamUsers.map(u => u._id) };
    }

    const leaves = await LeaveRequest.find(filter)
      .populate('userId', 'name team')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};

exports.getTeamAll = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const teamUsers = await User.find({ team: req.user.team }, '_id');
    const leaves = await LeaveRequest.find({ userId: { $in: teamUsers.map(u => u._id) } })
      .populate('userId', 'name team')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};
