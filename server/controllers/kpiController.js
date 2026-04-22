const KpiTarget = require('../models/KpiTarget');
const WorkUnit = require('../models/WorkUnit');
const { getISOWeek } = require('date-fns');
const logAudit = require('../utils/auditLogger');

const TEAM_METRICS = {
  Sales: ['callsMade', 'emailsSent', 'leadsAdded', 'dailyRevenue', 'dealsWon'],
  Marketing: ['emailsSent', 'campaignsLaunched', 'leadsGenerated', 'openRate'],
  Production: ['casesMoved', 'casesSubmitted', 'casesDelivered'],
};

exports.setTarget = async (req, res, next) => {
  try {
    const { userId, team, metric, targetValue, period } = req.body;
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getISOWeek(now);
    const month = now.getMonth() + 1;

    const filter = { userId, team, metric, period, year };
    if (period === 'weekly') filter.weekNumber = weekNumber;
    else filter.month = month;

    const target = await KpiTarget.findOneAndUpdate(
      filter,
      { ...filter, targetValue, setByAdmin: req.user._id },
      { upsert: true, new: true }
    );
    await logAudit(req, 'kpi_target_set', 'KpiTarget', target._id, null, { userId, metric, targetValue, period });
    res.status(201).json(target);
  } catch (e) { next(e); }
};

exports.getUserTargets = async (req, res, next) => {
  try {
    const { period = 'weekly' } = req.query;
    const now = new Date();
    const year = now.getFullYear();
    const filter = { userId: req.params.userId, period, year };
    if (period === 'weekly') filter.weekNumber = getISOWeek(now);
    else filter.month = now.getMonth() + 1;

    const targets = await KpiTarget.find(filter).populate('setByAdmin', 'name');
    res.json(targets);
  } catch (e) { next(e); }
};

exports.getTeamTargets = async (req, res, next) => {
  try {
    const { period = 'weekly' } = req.query;
    const now = new Date();
    const year = now.getFullYear();
    const filter = { team: req.params.team, period, year };
    if (period === 'weekly') filter.weekNumber = getISOWeek(now);
    else filter.month = now.getMonth() + 1;

    const targets = await KpiTarget.find(filter)
      .populate('userId', 'name team')
      .populate('setByAdmin', 'name');
    res.json(targets);
  } catch (e) { next(e); }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const target = await KpiTarget.findByIdAndUpdate(
      req.params.id,
      { $inc: { currentValue: req.body.increment || 0 }, currentValue: req.body.currentValue },
      { new: true }
    );
    if (!target) return res.status(404).json({ error: 'Not found' });
    res.json(target);
  } catch (e) { next(e); }
};

exports.ceoSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getISOWeek(now);

    const targets = await KpiTarget.find({ period: 'weekly', year, weekNumber })
      .populate('userId', 'name team');

    const byTeam = {};
    for (const t of targets) {
      const team = t.team;
      if (!byTeam[team]) byTeam[team] = { total: 0, achieved: 0, count: 0 };
      const pct = t.targetValue ? (t.currentValue / t.targetValue) * 100 : 0;
      byTeam[team].total += 100;
      byTeam[team].achieved += Math.min(pct, 100);
      byTeam[team].count++;
    }

    const summary = Object.entries(byTeam).map(([team, d]) => ({
      team,
      avgAchievement: d.count ? Math.round(d.achieved / d.count) : 0,
      targetCount: d.count,
    }));

    res.json({ weekNumber, year, summary, raw: targets });
  } catch (e) { next(e); }
};

exports.syncProgressFromWorkUnits = async (userId, team, date) => {
  try {
    const now = new Date(date);
    const year = now.getFullYear();
    const weekNumber = getISOWeek(now);
    const month = now.getMonth() + 1;

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(year, month - 1, 1);

    const weeklyUnits = await WorkUnit.find({ userId, date: { $gte: startOfWeek, $lte: now } });
    const monthlyUnits = await WorkUnit.find({ userId, date: { $gte: startOfMonth, $lte: now } });

    const computeMetrics = (units) => ({
      callsMade: units.reduce((s, u) => s + (u.callsMade || 0), 0),
      emailsSent: units.reduce((s, u) => s + (u.emailsSent || 0), 0),
      leadsAdded: units.reduce((s, u) => s + (u.leadsAdded || 0), 0),
      dailyRevenue: units.reduce((s, u) => s + (u.dailyRevenue || 0), 0),
      leadsGenerated: units.reduce((s, u) => s + (u.leadsGenerated || 0), 0),
      dealsWon: units.filter(u => u.leadStage === 'Won').length,
    });

    const weekMetrics = computeMetrics(weeklyUnits);
    const monthMetrics = computeMetrics(monthlyUnits);

    const weeklyTargets = await KpiTarget.find({ userId, period: 'weekly', year, weekNumber, team });
    const monthlyTargets = await KpiTarget.find({ userId, period: 'monthly', year, month, team });

    for (const t of weeklyTargets) {
      if (weekMetrics[t.metric] !== undefined) {
        t.currentValue = weekMetrics[t.metric];
        await t.save();
      }
    }
    for (const t of monthlyTargets) {
      if (monthMetrics[t.metric] !== undefined) {
        t.currentValue = monthMetrics[t.metric];
        await t.save();
      }
    }
  } catch (e) {
    console.error('KPI sync failed:', e.message);
  }
};
