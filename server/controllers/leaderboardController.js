const WorkUnit = require('../models/WorkUnit');
const User = require('../models/User');
const { getISOWeek, startOfISOWeek, startOfMonth } = require('date-fns');
const calcScore = require('../utils/scoreCalculator');

exports.salesLeaderboard = async (req, res, next) => {
  try {
    const { period = 'weekly', metric = 'dealValue' } = req.query;
    const now = new Date();

    let startDate;
    if (period === 'weekly') {
      startDate = startOfISOWeek(now);
    } else {
      startDate = startOfMonth(now);
    }

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

    const ranked = Object.values(byUser)
      .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
      .map((u, i) => ({ ...u, rank: i + 1, units: undefined }));

    res.json({ period, metric, leaderboard: ranked });
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
