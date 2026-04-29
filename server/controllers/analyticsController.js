const WorkUnit = require('../models/WorkUnit');
const { getISOWeek, startOfISOWeek, addDays, format } = require('date-fns');

exports.orgHeatmap = async (req, res, next) => {
  try {
    const allowed = ['superadmin', 'hr_admin', 'overall_admin'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();
    const weekOffset = parseInt(req.query.week) || 0;
    const weekStart = startOfISOWeek(addDays(now, weekOffset * -7));
    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);

    const units = await WorkUnit.find({
      status: 'Completed',
      endTime: { $gte: weekStart, $lte: weekEnd },
    });

    const grid = {};
    for (let d = 0; d < 7; d++) {
      grid[d] = {};
      for (let h = 8; h <= 20; h++) grid[d][h] = 0;
    }

    units.forEach(u => {
      if (!u.endTime) return;
      const dt = new Date(u.endTime);
      const dayOfWeek = (dt.getDay() + 6) % 7;
      const hour = dt.getHours();
      if (hour >= 8 && hour <= 20) {
        grid[dayOfWeek][hour] = (grid[dayOfWeek][hour] || 0) + 1;
      }
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = days.map((day, i) => ({
      day,
      hours: Object.entries(grid[i] || {}).map(([hour, count]) => ({ hour: parseInt(hour), count })),
    }));

    res.json({ weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString(), grid: result });
  } catch (e) { next(e); }
};

exports.heatmap = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (req.user.role === 'user' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();
    const weekOffset = parseInt(req.query.week) || 0;
    const weekStart = startOfISOWeek(addDays(now, weekOffset * -7));
    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);

    const units = await WorkUnit.find({
      userId,
      status: 'Completed',
      endTime: { $gte: weekStart, $lte: weekEnd },
    });

    // Grid: day (0=Mon..6=Sun) x hour (8..20)
    const grid = {};
    for (let d = 0; d < 7; d++) {
      grid[d] = {};
      for (let h = 8; h <= 20; h++) grid[d][h] = 0;
    }

    units.forEach(u => {
      if (!u.endTime) return;
      const dt = new Date(u.endTime);
      const dayOfWeek = (dt.getDay() + 6) % 7; // Mon=0
      const hour = dt.getHours();
      if (hour >= 8 && hour <= 20) {
        if (!grid[dayOfWeek]) grid[dayOfWeek] = {};
        grid[dayOfWeek][hour] = (grid[dayOfWeek][hour] || 0) + 1;
      }
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = days.map((day, i) => ({
      day,
      hours: Object.entries(grid[i] || {}).map(([hour, count]) => ({ hour: parseInt(hour), count })),
    }));

    res.json({ weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString(), grid: result });
  } catch (e) { next(e); }
};

exports.taskTimeAvg = async (req, res, next) => {
  try {
    const { team } = req.params;
    const filter = team ? { team } : {};
    const units = await WorkUnit.find({ ...filter, startTime: { $exists: true }, endTime: { $exists: true } });

    const byType = {};
    units.forEach(u => {
      const type = u.workType;
      const mins = (u.endTime - u.startTime) / 60000;
      if (mins > 0 && mins < 480) {
        if (!byType[type]) byType[type] = { total: 0, count: 0 };
        byType[type].total += mins;
        byType[type].count++;
      }
    });

    const result = Object.entries(byType).map(([type, d]) => ({
      type,
      avgMinutes: Math.round(d.total / d.count),
      count: d.count,
    }));

    res.json(result);
  } catch (e) { next(e); }
};

exports.outliers = async (req, res, next) => {
  try {
    const { team } = req.params;
    const filter = team ? { team } : {};
    const units = await WorkUnit.find({ ...filter, startTime: { $exists: true }, endTime: { $exists: true } })
      .populate('userId', 'name');

    const byType = {};
    units.forEach(u => {
      const type = u.workType;
      const mins = (u.endTime - u.startTime) / 60000;
      if (mins > 0 && mins < 1440) {
        if (!byType[type]) byType[type] = [];
        byType[type].push(mins);
      }
    });

    const outliers = [];
    units.forEach(u => {
      const type = u.workType;
      const mins = (u.endTime - u.startTime) / 60000;
      const arr = byType[type] || [];
      if (arr.length < 3) return;
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      if (mins > avg * 2.5) {
        outliers.push({ unitId: u._id, title: u.title, userId: u.userId, type, durationMinutes: Math.round(mins), avgMinutes: Math.round(avg) });
      }
    });

    res.json(outliers.slice(0, 50));
  } catch (e) { next(e); }
};
