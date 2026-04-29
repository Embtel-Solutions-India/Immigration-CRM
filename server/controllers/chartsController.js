const WorkUnit = require('../models/WorkUnit');
const User = require('../models/User');
const KpiTarget = require('../models/KpiTarget');
const { getISOWeek, getDaysInMonth, startOfMonth, endOfMonth, format } = require('date-fns');

function getDayKey(date) {
  return new Date(date).getDate();
}

async function buildDailyData(units, metric, month, year) {
  const days = getDaysInMonth(new Date(year, month - 1));
  const daily = Array.from({ length: days }, (_, i) => ({ day: i + 1, value: 0 }));

  units.forEach(u => {
    const d = new Date(u.date);
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      const idx = d.getDate() - 1;
      if (metric === 'dealValue') daily[idx].value += u.dealValue || 0;
      else if (metric === 'callsMade') daily[idx].value += u.callsMade || 0;
      else if (metric === 'emailsSent') daily[idx].value += u.emailsSent || 0;
      else if (metric === 'leadsGenerated') daily[idx].value += u.leadsGenerated || 0;
      else if (metric === 'leadsAdded') daily[idx].value += u.leadsAdded || 0;
      else if (metric === 'count') daily[idx].value += 1;
    }
  });
  return daily;
}

exports.salesOrg = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const metric = req.query.metric || 'dealValue';

    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const units = await WorkUnit.find({ kind: 'SalesUnit', date: { $gte: start, $lte: end } });

    const days = getDaysInMonth(new Date(year, month - 1));
    const teamData = Array.from({ length: days }, (_, i) => ({ day: i + 1, Sales: 0 }));

    units.forEach(u => {
      const d = new Date(u.date).getDate() - 1;
      if (metric === 'dealValue') teamData[d].Sales += u.dealValue || 0;
      else if (metric === 'callsMade') teamData[d].Sales += u.callsMade || 0;
      else if (metric === 'emailsSent') teamData[d].Sales += u.emailsSent || 0;
    });

    const weekTargets = await buildWeekTargetDots(year, month, metric, null);
    res.json({ data: teamData, weekTargets, month, year, metric });
  } catch (e) { next(e); }
};

exports.salesTeam = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const metric = req.query.metric || 'dealValue';

    const members = await User.find({ team: 'Sales', isActive: true }, '_id name');
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const days = getDaysInMonth(new Date(year, month - 1));

    const seriesMap = {};
    for (const m of members) {
      const units = await WorkUnit.find({ userId: m._id, kind: 'SalesUnit', date: { $gte: start, $lte: end } });
      seriesMap[m.name] = Array.from({ length: days }, (_, i) => ({ day: i + 1, value: 0 }));
      units.forEach(u => {
        const d = new Date(u.date).getDate() - 1;
        if (metric === 'dealValue') seriesMap[m.name][d].value += u.dealValue || 0;
        else if (metric === 'callsMade') seriesMap[m.name][d].value += u.callsMade || 0;
        else if (metric === 'emailsSent') seriesMap[m.name][d].value += u.emailsSent || 0;
      });
    }

    res.json({ series: seriesMap, members: members.map(m => ({ id: m._id, name: m.name })), month, year, metric });
  } catch (e) { next(e); }
};

exports.salesUser = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const metric = req.query.metric || 'dealValue';
    const { userId } = req.params;

    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const units = await WorkUnit.find({ userId, kind: 'SalesUnit', date: { $gte: start, $lte: end } });
    const daily = await buildDailyData(units, metric, month, year);
    const weekTargets = await buildWeekTargetDots(year, month, metric, userId);

    res.json({ daily, weekTargets, month, year, metric });
  } catch (e) { next(e); }
};

exports.marketingOrg = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const metric = req.query.metric || 'emailsSent';

    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const units = await WorkUnit.find({ kind: 'MarketingUnit', date: { $gte: start, $lte: end } });
    const daily = await buildDailyData(units, metric, month, year);

    res.json({ data: daily.map(d => ({ day: d.day, Marketing: d.value })), month, year, metric });
  } catch (e) { next(e); }
};

exports.marketingTeam = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const metric = req.query.metric || 'emailsSent';

    const members = await User.find({ team: 'Marketing', isActive: true }, '_id name');
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const days = getDaysInMonth(new Date(year, month - 1));

    const seriesMap = {};
    for (const m of members) {
      const units = await WorkUnit.find({ userId: m._id, kind: 'MarketingUnit', date: { $gte: start, $lte: end } });
      seriesMap[m.name] = Array.from({ length: days }, (_, i) => ({ day: i + 1, value: 0 }));
      units.forEach(u => {
        const d = new Date(u.date).getDate() - 1;
        if (metric === 'emailsSent') seriesMap[m.name][d].value += u.emailsSent || 0;
        else if (metric === 'leadsGenerated') seriesMap[m.name][d].value += u.leadsGenerated || 0;
        else if (metric === 'leadsAdded') seriesMap[m.name][d].value += u.leadsAdded || 0;
      });
    }

    res.json({ series: seriesMap, members: members.map(m => ({ id: m._id, name: m.name })), month, year, metric });
  } catch (e) { next(e); }
};

exports.marketingUser = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const metric = req.query.metric || 'emailsSent';
    const { userId } = req.params;

    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const units = await WorkUnit.find({ userId, kind: 'MarketingUnit', date: { $gte: start, $lte: end } });
    const daily = await buildDailyData(units, metric, month, year);

    res.json({ daily, month, year, metric });
  } catch (e) { next(e); }
};

async function buildWeekTargetDots(year, month, metric, userId) {
  const days = getDaysInMonth(new Date(year, month - 1));
  const targets = [];
  for (let week = 1; week <= 5; week++) {
    const weekEndDay = Math.min(week * 7, days);
    const filter = { period: 'weekly', year, weekNumber: week };
    if (userId) filter.userId = userId;
    const t = await KpiTarget.findOne({ ...filter, metric });
    if (t) targets.push({ day: weekEndDay, targetValue: t.targetValue, week });
  }
  return targets;
}
