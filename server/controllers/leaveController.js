const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { createInternal } = require('./notificationController');
const logAudit = require('../utils/auditLogger');
const { normalizeRole, isHrAdmin, isHrRole, isSuperAdmin } = require('../utils/roles');

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
    const leave = await LeaveRequest.findById(req.params.id).populate('userId', 'name team role');

    if (!leave) return res.status(404).json({ error: 'Not found' });
    if (leave.userId?._id?.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot review your own leave request' });
    }

    const actorRole = normalizeRole(req.user.role);
    const targetRole = normalizeRole(leave.userId?.role);
    if (!isSuperAdmin(actorRole) && targetRole === 'hr_admin') {
      return res.status(403).json({ error: 'HR admin leave requests must be reviewed by superadmin' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ error: 'Leave request has already been reviewed' });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status' });
    }

    if (!isHrAdmin(actorRole) && !isSuperAdmin(actorRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    leave.status = status;
    leave.reviewNote = reviewNote;
    leave.reviewedBy = req.user._id;
    await leave.save();

    const reviewerName = req.user.name || 'Admin';
    const statusLabel = status === 'Approved' ? 'approved' : 'rejected';
    await createInternal(
      leave.userId._id,
      'leave_update',
      `Leave request ${statusLabel}`,
      `Your leave request for ${leave.dates.length} day(s) has been ${statusLabel} by ${reviewerName}.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
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
    const actorRole = normalizeRole(req.user.role);
    if (req.user._id.toString() !== userId) {
      if (actorRole === 'admin') {
        const target = await User.findById(userId, 'team');
        if (!target || target.team !== req.user.team) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      } else if (!isHrRole(actorRole) && !isSuperAdmin(actorRole)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const leaves = await LeaveRequest.find({ userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};

exports.getAll = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({})
      .populate('userId', 'name team')
      .populate('reviewedBy', 'name role team')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};

exports.getPending = async (req, res, next) => {
  try {
    const filter = { status: 'Pending' };
    const actorRole = normalizeRole(req.user.role);
    if (!isSuperAdmin(actorRole)) {
      const hrAdminUsers = await User.find({ role: { $in: ['hr_admin', 'hr'] } }, '_id');
      filter.userId = { $nin: hrAdminUsers.map(u => u._id) };
    }

    const leaves = await LeaveRequest.find(filter)
      .populate('userId', 'name team')
      .populate('reviewedBy', 'name role team')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};

exports.getTeamAll = async (req, res, next) => {
  try {
    const filter = {};
    const actorRole = normalizeRole(req.user.role);
    if (actorRole === 'admin') {
      const teamUsers = await User.find({ team: req.user.team }, '_id');
      filter.userId = { $in: teamUsers.map(u => u._id) };
    }

    const leaves = await LeaveRequest.find(filter)
      .populate('userId', 'name team')
      .populate('reviewedBy', 'name role team')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) { next(e); }
};
