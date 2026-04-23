const Case = require('../models/Case');
const logActivity = require('../utils/activityLogger');
const { normalizeRole } = require('../utils/roles');

function isHrTeamUser(user) {
  const role = normalizeRole(user?.role);
  return role === 'hr_user' || (role === 'user' && user?.team === 'HR');
}

exports.list = async (req, res, next) => {
  try {
    if (isHrTeamUser(req.user)) return res.status(403).json({ error: 'Forbidden' });
    const { stage, assignedManager, overdue, priority, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (req.user.role === 'user') filter.assignedManager = req.user._id;
    if (stage) filter.stage = stage;
    if (assignedManager) filter.assignedManager = assignedManager;
    if (priority) filter.priority = priority;
    if (overdue === 'true') filter.slaDeadline = { $lt: new Date() };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Case.find(filter)
        .sort({ slaDeadline: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedManager', 'name'),
      Case.countDocuments(filter),
    ]);
    res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.clientName && payload.name) payload.clientName = payload.name;
    if (!payload.clientEmail && payload.email) payload.clientEmail = payload.email;
    if (!payload.clientPhone && payload.phone) payload.clientPhone = payload.phone;
    if (!payload.visaCategory && payload.caseType) payload.visaCategory = payload.caseType;
    if (!payload.slaDeadline && payload.deadline) payload.slaDeadline = payload.deadline;

    if (!payload.visaCategory) {
      return res.status(400).json({ error: 'Visa category is required' });
    }

    const c = await Case.create(payload);
    await logActivity(req.user._id, 'Production', 'created_case', 'Case', c._id, { caseId: c.caseId });
    res.status(201).json(c);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    if (isHrTeamUser(req.user)) return res.status(403).json({ error: 'Forbidden' });
    const c = await Case.findById(req.params.id)
      .populate('assignedManager', 'name')
      .populate('stageHistory.movedBy', 'name')
      .populate('statusUpdates.updatedBy', 'name');
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    if (!req.body.clientName && req.body.name) req.body.clientName = req.body.name;
    if (!req.body.clientEmail && req.body.email) req.body.clientEmail = req.body.email;
    if (!req.body.clientPhone && req.body.phone) req.body.clientPhone = req.body.phone;
    if (!req.body.visaCategory && req.body.caseType) req.body.visaCategory = req.body.caseType;
    if (!req.body.slaDeadline && req.body.deadline) req.body.slaDeadline = req.body.deadline;

    const prev = await Case.findById(req.params.id).lean();
    if (!prev) return res.status(404).json({ error: 'Not found' });

    if (req.body.stage && req.body.stage !== prev.stage) {
      req.body.stageEnteredAt = new Date();
      req.body.$push = {
        stageHistory: {
          stage: req.body.stage,
          movedAt: new Date(),
          movedBy: req.user._id,
          notes: req.body.stageNote || '',
        },
      };
    }

    const c = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await logActivity(req.user._id, 'Production', 'case_updated', 'Case', c._id, { stage: c.stage });
    res.json(c);
  } catch (e) { next(e); }
};

exports.addStatusUpdate = async (req, res, next) => {
  try {
    if (isHrTeamUser(req.user)) return res.status(403).json({ error: 'Forbidden' });
    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    const { stage, note } = req.body;
    const prevStage = c.stage;
    if (stage && stage !== c.stage) {
      c.stage = stage;
      c.stageEnteredAt = new Date();
      c.stageHistory.push({ stage, movedAt: new Date(), movedBy: req.user._id, notes: note || '' });
    }
    c.statusUpdates.push({ note, updatedAt: new Date(), updatedBy: req.user._id });
    await c.save();
    await logActivity(req.user._id, 'Production', 'case_stage_updated', 'Case', c._id, { stage, note });
    res.json(c);
  } catch (e) { next(e); }
};
