const EodReport = require('../models/EodReport');
const WorkUnit = require('../models/WorkUnit');
const User = require('../models/User');
const { sendEodEmail } = require('../utils/emailService');
const { normalizeRole } = require('../utils/roles');

async function buildEodReport(userId, date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const d2 = new Date(date);
  d2.setHours(23, 59, 59, 999);

  const units = await WorkUnit.find({ userId, date: { $gte: d, $lte: d2 } });

  const tasksCompleted = units.filter(u => u.status === 'Completed').length;
  const totalTimeSpent = units.reduce((s, u) => {
    if (u.startTime && u.endTime) s += Math.round((u.endTime - u.startTime) / 60000);
    return s;
  }, 0);
  const emailsSent = units.reduce((s, u) => s + (u.emailsSent || 0), 0);
  const callsMade = units.reduce((s, u) => s + (u.callsMade || 0), 0);
  const leadsUpdated = units.filter(u => u.leadStage).length;
  const casesMoved = units.filter(u => u.kind === 'ProductionUnit' && u.stage).length;

  return { userId, date: d, tasksCompleted, totalTimeSpent, emailsSent, callsMade, leadsUpdated, casesMoved, rawSummary: units.map(u => ({ title: u.title, status: u.status, workType: u.workType })), generatedAt: new Date() };
}

exports.generate = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const actorRole = normalizeRole(req.user.role);
    if ((actorRole === 'user' || actorRole === 'hr_user') && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (actorRole === 'admin') {
      const target = await User.findById(userId, 'team');
      if (!target || target.team !== req.user.team) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const data = await buildEodReport(userId, date);

    const report = await EodReport.findOneAndUpdate(
      { userId, date: data.date },
      data,
      { upsert: true, new: true }
    );

    const user = await User.findById(userId);
    if (user) {
      try { await sendEodEmail(user, report); } catch (e) { console.error('EOD email failed:', e.message); }
    }

    res.json(report);
  } catch (e) { next(e); }
};

exports.getForUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { date } = req.query;
    const actorRole = normalizeRole(req.user.role);
    if ((actorRole === 'user' || actorRole === 'hr_user') && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (actorRole === 'admin') {
      const target = await User.findById(userId, 'team');
      if (!target || target.team !== req.user.team) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const filter = { userId };
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const d2 = new Date(date); d2.setHours(23, 59, 59, 999);
      filter.date = { $gte: d, $lte: d2 };
    }

    const reports = await EodReport.find(filter).sort({ date: -1 }).limit(30);
    res.json({ reports });
  } catch (e) { next(e); }
};

exports.getTeamDay = async (req, res, next) => {
  try {
    const { date } = req.query;
    const actorRole = normalizeRole(req.user.role);
    const teamFilter = actorRole === 'admin' ? { team: req.user.team } : {};
    const users = await User.find({ ...teamFilter, isActive: true }, '_id name');
    const userIds = users.map(u => u._id);

    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);
    const d2 = new Date(d); d2.setHours(23, 59, 59, 999);

    const reports = await EodReport.find({ userId: { $in: userIds }, date: { $gte: d, $lte: d2 } })
      .populate('userId', 'name team');

    res.json({ reports });
  } catch (e) { next(e); }
};

exports.getTeamSummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    const users = await User.find({ isActive: true }, '_id team');
    const userIds = users.map(u => u._id);

    const teamTotals = new Map();
    const teamCategories = new Map();
    ['Sales', 'Marketing', 'Production', 'HR'].forEach(team => {
      teamTotals.set(team, 0);
      teamCategories.set(team, {});
    });

    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);
    const d2 = new Date(d); d2.setHours(23, 59, 59, 999);

    const units = await WorkUnit.find({
      userId: { $in: userIds },
      date: { $gte: d, $lte: d2 },
      status: 'Completed',
    }, 'team workType');

    units.forEach(u => {
      const team = u.team;
      const prev = teamTotals.get(team) || 0;
      teamTotals.set(team, prev + 1);
      const categories = teamCategories.get(team) || {};
      const type = u.workType || 'other';
      categories[type] = (categories[type] || 0) + 1;
      teamCategories.set(team, categories);
    });

    const teams = Array.from(teamTotals.entries()).map(([team, totalWorkUnits]) => ({
      team,
      totalWorkUnits,
      categories: teamCategories.get(team) || {},
    }));

    res.json({ date: d.toISOString(), teams });
  } catch (e) { next(e); }
};

exports.generateForAll = async (date) => {
  const users = await User.find({ isActive: true }, '_id');
  for (const user of users) {
    try {
      const data = await buildEodReport(user._id, date);
      await EodReport.findOneAndUpdate(
        { userId: user._id, date: data.date },
        data,
        { upsert: true }
      );
    } catch (e) {
      console.error(`EOD gen failed for ${user._id}:`, e.message);
    }
  }
};
