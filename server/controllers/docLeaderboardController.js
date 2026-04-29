const DocWorkUnit = require('../models/DocWorkUnit');
const DocDocument = require('../models/DocDocument');
const DocClient = require('../models/DocClient');
const User = require('../models/User');
const { normalizeRole } = require('../utils/roles');
const { startOfISOWeek, startOfMonth } = require('date-fns');

function resolveStart(period) {
  const now = new Date();
  return period === 'weekly' ? startOfISOWeek(now) : startOfMonth(now);
}

exports.getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'monthly', metric = 'completedValue', search = '' } = req.query;
    const startDate = resolveStart(period);

    const users = await User.find(
      { team: 'Documentation', isActive: true, role: { $in: ['admin', 'user'] } },
      'name email role'
    );

    const rows = await Promise.all(users.map(async (u) => {
      const [workUnits, docs, clients] = await Promise.all([
        DocWorkUnit.find({ assignedTo: u._id }),
        DocDocument.find({ uploadedBy: u._id, updatedAt: { $gte: startDate } }),
        DocClient.find({ assignedTo: u._id }, 'totalWorkValue workCompletedValue'),
      ]);

      const completedUnits = workUnits.filter(w => w.status === 'Completed');
      const completedValue = completedUnits.reduce((s, w) => s + (w.value || 0), 0);
      const totalValue = workUnits.reduce((s, w) => s + (w.value || 0), 0);
      const completionPct = workUnits.length > 0
        ? Math.round((completedUnits.length / workUnits.length) * 100)
        : 0;

      return {
        userId: u._id,
        name: u.name,
        role: u.role,
        totalWorkUnits: workUnits.length,
        completedWorkUnits: completedUnits.length,
        completedValue,
        totalValue,
        docsSubmitted: docs.filter(d => d.status === 'Submitted' || d.status === 'Approved').length,
        pendingDocs: docs.filter(d => d.status === 'Pending').length,
        totalClients: clients.length,
        completionPct,
      };
    }));

    const metricMap = {
      completedValue: 'completedValue',
      completionPct: 'completionPct',
      completedWorkUnits: 'completedWorkUnits',
      docsSubmitted: 'docsSubmitted',
      totalClients: 'totalClients',
    };
    const sortKey = metricMap[metric] || 'completedValue';

    let filtered = rows;
    if (search) {
      filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    }

    const ranked = filtered
      .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
      .map((r, i) => ({ ...r, rank: i + 1 }));

    res.json({ period, metric, leaderboard: ranked });
  } catch (e) { next(e); }
};
