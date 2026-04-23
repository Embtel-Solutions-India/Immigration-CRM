const WorkUnit = require('../models/WorkUnit');
const logActivity = require('../utils/activityLogger');
const { normalizeRole } = require('../utils/roles');

const kindMap = { Sales: 'SalesUnit', Marketing: 'MarketingUnit', Production: 'ProductionUnit', HR: 'HRUnit' };

exports.list = async (req, res, next) => {
  try {
    const { date, from, to, team, status, userId, kind, page = 1, limit = 50 } = req.query;
    const filter = { ...req.scopeFilter };

    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const d2 = new Date(date); d2.setHours(23, 59, 59, 999);
      filter.date = { $gte: d, $lte: d2 };
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const actorRole = normalizeRole(req.user.role);
    if (team && actorRole !== 'user' && actorRole !== 'hr_user') filter.team = team;
    if (status) filter.status = status;
    if (userId && actorRole !== 'user' && actorRole !== 'hr_user') filter.userId = userId;
    if (kind) filter.kind = kind;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      WorkUnit.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name team'),
      WorkUnit.countDocuments(filter),
    ]);

    res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const body = req.body;
    const team = body.team || req.user.team;
    const kind = body.kind || kindMap[team];
    const unit = await WorkUnit.create({ ...body, kind, userId: req.user._id, team });
    await logActivity(req.user._id, team, 'created_work_unit', 'WorkUnit', unit._id, { title: unit.title });
    res.status(201).json(unit);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const unit = await WorkUnit.findOne({ _id: req.params.id, ...req.scopeFilter })
      .populate('userId', 'name team')
      .populate('comments.authorId', 'name');
    if (!unit) return res.status(404).json({ error: 'Not found' });
    res.json(unit);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const filter = actorRole === 'user' || actorRole === 'hr_user'
      ? { _id: req.params.id, userId: req.user._id }
      : { _id: req.params.id };
    const unit = await WorkUnit.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!unit) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user._id, unit.team, 'updated_work_unit', 'WorkUnit', unit._id);
    res.json(unit);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await WorkUnit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
};

exports.addComment = async (req, res, next) => {
  try {
    const unit = await WorkUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Not found' });
    unit.comments.push({ authorId: req.user._id, text: req.body.text });
    await unit.save();
    res.json(unit.comments[unit.comments.length - 1]);
  } catch (e) { next(e); }
};

exports.timerStart = async (req, res, next) => {
  try {
    const unit = await WorkUnit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { startTime: new Date(), timerActive: true, status: 'In Progress' },
      { new: true }
    );
    if (!unit) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user._id, unit.team, 'timer_started', 'WorkUnit', unit._id);
    res.json(unit);
  } catch (e) { next(e); }
};

exports.timerStop = async (req, res, next) => {
  try {
    const unit = await WorkUnit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { endTime: new Date(), timerActive: false },
      { new: true }
    );
    if (!unit) return res.status(404).json({ error: 'Not found' });
    await logActivity(req.user._id, unit.team, 'timer_stopped', 'WorkUnit', unit._id);
    res.json(unit);
  } catch (e) { next(e); }
};
