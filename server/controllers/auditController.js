const AuditLog = require('../models/AuditLog');
const ExcelJS = require('exceljs');

exports.getLogs = async (req, res, next) => {
  try {
    const { user, team, action, from, to, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (user) filter.performedBy = user;
    if (action) filter.action = action;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); filter.timestamp.$lte = d; }
    }

    if (team) {
      const User = require('../models/User');
      const teamUsers = await User.find({ team }, '_id');
      filter.performedBy = { $in: teamUsers.map(u => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('performedBy', 'name team'),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const { user, team, action, from, to } = req.query;
    const filter = {};
    if (user) filter.performedBy = user;
    if (action) filter.action = action;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); filter.timestamp.$lte = d; }
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(5000)
      .populate('performedBy', 'name team');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Audit Log');
    sheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 22 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Team', key: 'team', width: 15 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Action', key: 'action', width: 25 },
      { header: 'Entity', key: 'entity', width: 15 },
      { header: 'Entity ID', key: 'entityId', width: 28 },
      { header: 'IP Address', key: 'ipAddress', width: 16 },
    ];

    logs.forEach(l => {
      sheet.addRow({
        timestamp: l.timestamp ? l.timestamp.toISOString() : '',
        user: l.performedBy?.name || '',
        team: l.performedBy?.team || '',
        role: l.role || '',
        action: l.action,
        entity: l.entity,
        entityId: l.entityId?.toString() || '',
        ipAddress: l.ipAddress || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-log.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
};
