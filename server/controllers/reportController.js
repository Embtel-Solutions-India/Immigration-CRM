const WorkUnit = require('../models/WorkUnit');
const Case = require('../models/Case');
const User = require('../models/User');
const calcScore = require('../utils/scoreCalculator');
const { normalizeRole, isOverallAdmin, OVERALL_ADMIN_TEAMS } = require('../utils/roles');

function dateFilter(from, to) {
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to) { const d = new Date(to); d.setHours(23,59,59,999); f.$lte = d; }
  return Object.keys(f).length ? f : undefined;
}

exports.userReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const userId = req.params.userId;
    const actorRole = normalizeRole(req.user.role);
    if ((actorRole === 'user' || actorRole === 'hr_user') && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const df = dateFilter(from, to);
    const filter = { userId };
    if (df) filter.date = df;

    const units = await WorkUnit.find(filter);
    const totalMs = units.reduce((s, w) => {
      if (w.startTime && w.endTime) s += w.endTime - w.startTime;
      return s;
    }, 0);
    const hoursTracked = totalMs / 3600000;
    const score = calcScore(units, hoursTracked);

    const byStatus = units.reduce((acc, w) => { acc[w.status] = (acc[w.status]||0)+1; return acc; }, {});
    const byType = units.reduce((acc, w) => { acc[w.workType] = (acc[w.workType]||0)+1; return acc; }, {});

    res.json({ userId, total: units.length, byStatus, byType, hoursTracked: +hoursTracked.toFixed(2), score });
  } catch (e) { next(e); }
};

exports.teamReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { team } = req.params;
    const actorRole = normalizeRole(req.user.role);
    if (actorRole === 'admin' && req.user.team !== team) return res.status(403).json({ error: 'Forbidden' });
    if (isOverallAdmin(actorRole) && !OVERALL_ADMIN_TEAMS.includes(team)) return res.status(403).json({ error: 'Forbidden' });

    const df = dateFilter(from, to);
    const filter = { team };
    if (df) filter.date = df;

    const members = await User.find({ team, isActive: true, role: { $nin: ['superadmin', 'hr', 'hr_admin', 'hr_user'] } }, 'name _id');
    const memberIds = members.map((m) => m._id);
    const units = await WorkUnit.find({ ...filter, userId: { $in: memberIds } });

    const byUser = {};
    members.forEach(m => { byUser[m._id] = { name: m.name, units: [], score: 0 }; });
    units.forEach(u => {
      const key = u.userId.toString();
      if (byUser[key]) byUser[key].units.push(u);
    });

    const memberStats = Object.entries(byUser).map(([id, { name, units: wu }]) => {
      const hrs = wu.reduce((s, w) => {
        if (w.startTime && w.endTime) s += (w.endTime - w.startTime) / 3600000;
        return s;
      }, 0);
      return { userId: id, name, total: wu.length, completed: wu.filter(w=>w.status==='Completed').length, hoursTracked: +hrs.toFixed(2), score: calcScore(wu, hrs) };
    });

    res.json({ team, memberStats, totalUnits: units.length });
  } catch (e) { next(e); }
};

exports.orgReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const df = dateFilter(from, to);
    const filter = df ? { date: df } : {};

    const [allUnits, cases] = await Promise.all([
      WorkUnit.find(filter),
      Case.find(df ? { createdAt: df } : {}),
    ]);

    const salesUnits = allUnits.filter(u => u.kind === 'SalesUnit');
    const mktUnits   = allUnits.filter(u => u.kind === 'MarketingUnit');

    const totalRevenue = salesUnits.reduce((s, u) => s + (u.dailyRevenue || 0), 0);
    const expectedRevenue = salesUnits.reduce((s, u) => s + (u.dealValue || 0), 0);
    const totalCalls = salesUnits.reduce((s, u) => s + (u.callsMade || 0), 0);
    const leadsAdded = salesUnits.reduce((s, u) => s + (u.leadsAdded || 0), 0);
    const pipeline = salesUnits.reduce((acc, u) => {
      if (u.leadStage) acc[u.leadStage] = (acc[u.leadStage]||0)+1;
      return acc;
    }, {});

    const emailsSent = mktUnits.reduce((s, u) => s + (u.emailsSent || 0), 0);
    const leadsGenerated = mktUnits.reduce((s, u) => s + (u.leadsGenerated || 0), 0);
    const conversions = mktUnits.reduce((s, u) => s + (u.conversionsToSales || 0), 0);
    const avgOpenRate = mktUnits.length
      ? +(mktUnits.reduce((s, u) => s + (u.openRate || 0), 0) / mktUnits.length).toFixed(1)
      : 0;

    const casesByStage = cases.reduce((acc, c) => { acc[c.stage] = (acc[c.stage]||0)+1; return acc; }, {});
    const overdueCases = cases.filter(c => c.deadline && c.deadline < new Date() && c.stage !== 'Delivered').length;

    const teamScores = {};
    ['Sales', 'Marketing', 'Production', 'HR'].forEach(team => {
      const tu = allUnits.filter(u => u.team === team);
      const hrs = tu.reduce((s,w) => { if(w.startTime&&w.endTime) s+=(w.endTime-w.startTime)/3600000; return s; }, 0);
      teamScores[team] = calcScore(tu, hrs);
    });

    res.json({
      period: { from, to },
      sales: { totalRevenue, expectedRevenue, callsMade: totalCalls, leadsAdded, pipeline },
      marketing: { emailsSent, leadsGenerated, conversions, avgOpenRate },
      production: { totalCases: cases.length, byStage: casesByStage, overdueCount: overdueCases },
      efficiency: { teamScores },
    });
  } catch (e) { next(e); }
};

exports.pipeline = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const df = dateFilter(from, to);
    const filter = { kind: 'SalesUnit' };
    if (df) filter.date = df;
    const units = await WorkUnit.find(filter, 'leadStage dealValue expectedCloseDate userId title');
    const grouped = units.reduce((acc, u) => {
      const s = u.leadStage || 'Unknown';
      if (!acc[s]) acc[s] = { count: 0, totalValue: 0, items: [] };
      acc[s].count++;
      acc[s].totalValue += u.dealValue || 0;
      acc[s].items.push({ id: u._id, title: u.title, dealValue: u.dealValue, expectedCloseDate: u.expectedCloseDate });
      return acc;
    }, {});
    res.json(grouped);
  } catch (e) { next(e); }
};

exports.overallReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const df = dateFilter(from, to);
    const baseFilter = { team: { $in: OVERALL_ADMIN_TEAMS }, ...(df ? { date: df } : {}) };

    const [allUnits, cases] = await Promise.all([
      WorkUnit.find(baseFilter),
      Case.find(df ? { createdAt: df } : {}),
    ]);

    const salesUnits = allUnits.filter(u => u.kind === 'SalesUnit');
    const mktUnits   = allUnits.filter(u => u.kind === 'MarketingUnit');

    const totalRevenue   = salesUnits.reduce((s, u) => s + (u.dailyRevenue || 0), 0);
    const expectedRevenue = salesUnits.reduce((s, u) => s + (u.dealValue || 0), 0);
    const callsMade      = salesUnits.reduce((s, u) => s + (u.callsMade || 0), 0);
    const leadsAdded     = salesUnits.reduce((s, u) => s + (u.leadsAdded || 0), 0);
    const pipeline       = salesUnits.reduce((acc, u) => {
      if (u.leadStage) acc[u.leadStage] = (acc[u.leadStage] || 0) + 1;
      return acc;
    }, {});

    const emailsSent     = mktUnits.reduce((s, u) => s + (u.emailsSent || 0), 0);
    const leadsGenerated = mktUnits.reduce((s, u) => s + (u.leadsGenerated || 0), 0);
    const conversions    = mktUnits.reduce((s, u) => s + (u.conversionsToSales || 0), 0);
    const avgOpenRate    = mktUnits.length
      ? +(mktUnits.reduce((s, u) => s + (u.openRate || 0), 0) / mktUnits.length).toFixed(1)
      : 0;

    const casesByStage = cases.reduce((acc, c) => { acc[c.stage] = (acc[c.stage] || 0) + 1; return acc; }, {});
    const overdueCount = cases.filter(c => c.deadline && c.deadline < new Date() && c.stage !== 'Delivered').length;

    const teamScores = {};
    OVERALL_ADMIN_TEAMS.forEach(team => {
      const tu = allUnits.filter(u => u.team === team);
      const hrs = tu.reduce((s, w) => { if (w.startTime && w.endTime) s += (w.endTime - w.startTime) / 3600000; return s; }, 0);
      teamScores[team] = calcScore(tu, hrs);
    });

    res.json({
      period: { from, to },
      units: { total: allUnits.length, completed: allUnits.filter(u => u.status === 'Completed').length },
      sales: { totalRevenue, expectedRevenue, callsMade, leadsAdded, pipeline },
      marketing: { emailsSent, leadsGenerated, conversions, avgOpenRate },
      production: { totalCases: cases.length, byStage: casesByStage, overdueCount },
      efficiency: { teamScores },
    });
  } catch (e) { next(e); }
};

exports.activity = async (req, res, next) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const { userId, team, limit = 50 } = req.query;
    const actorRole = normalizeRole(req.user.role);
    const filter = { ...req.scopeFilter };
    if (userId && actorRole !== 'user' && actorRole !== 'hr_user') filter.userId = userId;
    if (team && actorRole !== 'user' && actorRole !== 'hr_user') filter.team = team;
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name');
    res.json(logs);
  } catch (e) { next(e); }
};
