const WorkUnit = require('../models/WorkUnit');
const User = require('../models/User');
const { startOfISOWeek, startOfMonth } = require('date-fns');
const calcScore = require('../utils/scoreCalculator');

function resolveStartDate(period) {
  const now = new Date();
  return {
    now,
    startDate: period === 'weekly' ? startOfISOWeek(now) : startOfMonth(now),
  };
}

function ensureLeaderboardAccess(req, res, team) {
  const role = req.user?.role;
  const userTeam = req.user?.team;
  if (role === 'superadmin') return true;
  if (role === 'admin' && userTeam === team) return true;
  res.status(403).json({ error: 'Insufficient permissions' });
  return false;
}

async function buildSalesLeaderboard(period, metric) {
  const { now, startDate } = resolveStartDate(period);
  const units = await WorkUnit.find({
    team: 'Sales',
    kind: 'SalesUnit',
    date: { $gte: startDate, $lte: now },
  }).populate('userId', 'name team');

  const byUser = {};
  for (const u of units) {
    if (!u.userId) continue;
    const uid = u.userId._id.toString();
    if (!byUser[uid]) {
      byUser[uid] = { userId: uid, name: u.userId.name, callsMade: 0, emailsSent: 0, leadsAdded: 0, dealValue: 0, dealsWon: 0, units: [] };
    }
    byUser[uid].callsMade += u.callsMade || 0;
    byUser[uid].emailsSent += u.emailsSent || 0;
    byUser[uid].leadsAdded += u.leadsAdded || 0;
    byUser[uid].dealValue += u.dealValue || 0;
    if (u.leadStage === 'Won') byUser[uid].dealsWon++;
    byUser[uid].units.push(u);
  }

  return Object.values(byUser)
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .map((u, i) => ({ ...u, rank: i + 1, units: undefined }));
}

async function buildMarketingLeaderboard(period, metric) {
  const { now, startDate } = resolveStartDate(period);
  const units = await WorkUnit.find({
    team: 'Marketing',
    kind: 'MarketingUnit',
    date: { $gte: startDate, $lte: now },
  }).populate('userId', 'name team');

  const byUser = {};
  for (const u of units) {
    if (!u.userId) continue;
    const uid = u.userId._id.toString();
    if (!byUser[uid]) {
      byUser[uid] = {
        userId: uid,
        name: u.userId.name,
        emailsSent: 0,
        leadsGenerated: 0,
        conversionsToSales: 0,
        campaignCost: 0,
        openRateTotal: 0,
        openRateCount: 0,
        clickRateTotal: 0,
        clickRateCount: 0,
      };
    }
    byUser[uid].emailsSent += u.emailsSent || 0;
    byUser[uid].leadsGenerated += u.leadsGenerated || 0;
    byUser[uid].conversionsToSales += u.conversionsToSales || 0;
    byUser[uid].campaignCost += u.campaignCost || 0;
    if (typeof u.openRate === 'number') {
      byUser[uid].openRateTotal += u.openRate;
      byUser[uid].openRateCount += 1;
    }
    if (typeof u.clickRate === 'number') {
      byUser[uid].clickRateTotal += u.clickRate;
      byUser[uid].clickRateCount += 1;
    }
  }

  const normalized = Object.values(byUser).map((u) => ({
    userId: u.userId,
    name: u.name,
    emailsSent: u.emailsSent,
    leadsGenerated: u.leadsGenerated,
    conversionsToSales: u.conversionsToSales,
    campaignCost: u.campaignCost,
    openRate: u.openRateCount ? u.openRateTotal / u.openRateCount : 0,
    clickRate: u.clickRateCount ? u.clickRateTotal / u.clickRateCount : 0,
  }));

  return normalized
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

exports.salesLeaderboard = async (req, res, next) => {
  try {
    if (!ensureLeaderboardAccess(req, res, 'Sales')) return;
    const { period = 'weekly', metric = 'dealValue' } = req.query;
    const ranked = await buildSalesLeaderboard(period, metric);
    res.json({ team: 'Sales', period, metric, leaderboard: ranked });
  } catch (e) { next(e); }
};

exports.marketingLeaderboard = async (req, res, next) => {
  try {
    if (!ensureLeaderboardAccess(req, res, 'Marketing')) return;
    const { period = 'weekly', metric = 'leadsGenerated' } = req.query;
    const ranked = await buildMarketingLeaderboard(period, metric);
    res.json({ team: 'Marketing', period, metric, leaderboard: ranked });
  } catch (e) { next(e); }
};

exports.ceoTopPerformers = async (req, res, next) => {
  try {
    const now = new Date();
    const startDate = startOfISOWeek(now);
    const result = {};

    for (const team of ['Sales', 'Marketing', 'Production']) {
      const users = await User.find({ team, isActive: true });
      let best = null;
      let bestScore = -1;

      for (const u of users) {
        const units = await WorkUnit.find({ userId: u._id, date: { $gte: startDate, $lte: now } });
        const hrs = units.reduce((s, w) => {
          if (w.startTime && w.endTime) s += (w.endTime - w.startTime) / 3600000;
          return s;
        }, 0);
        const score = calcScore(units, hrs);
        if (score > bestScore) {
          bestScore = score;
          best = { userId: u._id, name: u.name, team, score, totalUnits: units.length };
        }
      }
      result[team] = best;
    }

    res.json(result);
  } catch (e) { next(e); }
};
