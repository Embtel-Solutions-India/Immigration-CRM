const DocClient = require('../models/DocClient');
const DocCase = require('../models/DocCase');
const DocDocument = require('../models/DocDocument');
const DocWorkUnit = require('../models/DocWorkUnit');
const { normalizeRole } = require('../utils/roles');
const { startOfMonth, subMonths, format } = require('date-fns');

exports.getStats = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user.role);
    const isAdmin = role === 'superadmin' || role === 'admin';

    const clientFilter = isAdmin ? {} : { assignedTo: req.user._id };
    const clients = await DocClient.find(clientFilter, '_id status amountPaid totalWorkValue workCompletedValue');
    const clientIds = clients.map(c => c._id);

    const [
      activeCases, completedCases,
      totalDocs, submittedDocs, pendingDocs,
      workUnits,
    ] = await Promise.all([
      DocCase.countDocuments({ clientId: { $in: clientIds }, status: { $in: ['Open', 'In Progress', 'Under Review'] } }),
      DocCase.countDocuments({ clientId: { $in: clientIds }, status: 'Completed' }),
      DocDocument.countDocuments({ clientId: { $in: clientIds } }),
      DocDocument.countDocuments({ clientId: { $in: clientIds }, status: { $in: ['Submitted', 'Approved'] } }),
      DocDocument.countDocuments({ clientId: { $in: clientIds }, status: 'Pending' }),
      DocWorkUnit.find({ clientId: { $in: clientIds } }, 'status value completionPct'),
    ]);

    const totalWorkValue = workUnits.reduce((s, w) => s + (w.value || 0), 0);
    const completedWorkValue = workUnits
      .filter(w => w.status === 'Completed')
      .reduce((s, w) => s + (w.value || 0), 0);

    const totalAmountPaid = clients.reduce((s, c) => s + (c.amountPaid || 0), 0);
    const totalClientWorkValue = clients.reduce((s, c) => s + (c.totalWorkValue || 0), 0);

    const completionPct = totalWorkValue > 0
      ? Math.round((completedWorkValue / totalWorkValue) * 100)
      : 0;

    res.json({
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'Active').length,
      activeCases,
      completedCases,
      totalDocuments: totalDocs,
      submittedDocuments: submittedDocs,
      pendingDocuments: pendingDocs,
      remainingDocuments: totalDocs - submittedDocs,
      totalWorkValue,
      completedWorkValue,
      remainingWorkValue: totalWorkValue - completedWorkValue,
      completionPct,
      totalAmountPaid,
      totalClientWorkValue,
    });
  } catch (e) { next(e); }
};

exports.getMonthlyTrend = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user.role);
    const isAdmin = role === 'superadmin' || role === 'admin';
    const clientFilter = isAdmin ? {} : { assignedTo: req.user._id };
    const clientIds = (await DocClient.find(clientFilter, '_id')).map(c => c._id);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = startOfMonth(subMonths(new Date(), i - 1));
      const [completed, totalValue] = await Promise.all([
        DocWorkUnit.countDocuments({
          clientId: { $in: clientIds },
          status: 'Completed',
          updatedAt: { $gte: start, $lt: end },
        }),
        DocWorkUnit.aggregate([
          { $match: { clientId: { $in: clientIds }, status: 'Completed', updatedAt: { $gte: start, $lt: end } } },
          { $group: { _id: null, total: { $sum: '$value' } } },
        ]),
      ]);
      months.push({
        month: format(start, 'MMM yyyy'),
        completedUnits: completed,
        workValue: totalValue[0]?.total || 0,
      });
    }
    res.json(months);
  } catch (e) { next(e); }
};

exports.getClientProgress = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user.role);
    const isAdmin = role === 'superadmin' || role === 'admin';
    const clientFilter = isAdmin ? {} : { assignedTo: req.user._id };

    const clients = await DocClient.find(clientFilter, 'name totalWorkValue workCompletedValue status')
      .sort({ createdAt: -1 })
      .limit(10);

    const result = clients.map(c => ({
      name: c.name,
      total: c.totalWorkValue || 0,
      completed: c.workCompletedValue || 0,
      pct: c.totalWorkValue > 0 ? Math.round((c.workCompletedValue / c.totalWorkValue) * 100) : 0,
      status: c.status,
    }));
    res.json(result);
  } catch (e) { next(e); }
};
