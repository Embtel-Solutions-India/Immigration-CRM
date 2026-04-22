const cron = require('node-cron');
const WorkUnit = require('../models/WorkUnit');
const User = require('../models/User');
const Case = require('../models/Case');
const KpiTarget = require('../models/KpiTarget');
const { createInternal } = require('../controllers/notificationController');
const { generateForAll } = require('../controllers/eodController');
const { getISOWeek } = require('date-fns');

function startCronJobs() {
  // ── EOD Report — every weekday at 6:00 PM ─────────────────
  cron.schedule('0 18 * * 1-5', async () => {
    console.log('[CRON] Generating EOD reports...');
    await generateForAll(new Date().toISOString().slice(0, 10));
  });

  // ── Hourly notification triggers ─────────────────────────
  cron.schedule('0 * * * *', async () => {
    const now = new Date();

    // 1. Tasks due within 24 hours
    const tomorrow = new Date(now.getTime() + 24 * 3600000);
    const dueSoon = await WorkUnit.find({
      status: { $in: ['Pending', 'In Progress'] },
      endTime: { $gte: now, $lte: tomorrow },
    }).populate('userId', '_id team');

    for (const unit of dueSoon) {
      if (unit.userId) {
        await createInternal(unit.userId._id, 'task_deadline', 'Task Due Tomorrow', `Your task "${unit.title}" is due within 24 hours.`, `/work-units/${unit._id}`);
      }
    }

    // 2. Cases stuck in same stage for 5+ days
    const stuckCutoff = new Date(now.getTime() - 5 * 86400000);
    const stuckCases = await Case.find({
      stageEnteredAt: { $lte: stuckCutoff },
      stage: { $nin: ['Approved', 'Rejected', 'RFE Issued'] },
    });

    for (const c of stuckCases) {
      if (c.assignedManager) {
        await createInternal(c.assignedManager, 'case_stuck', 'Case Stuck in Stage', `Case ${c.caseId} has been in "${c.stage}" for 5+ days.`, `/cases/${c._id}`);
      }
    }

    // 3. Filing deadlines within 7 days
    const sevenDays = new Date(now.getTime() + 7 * 86400000);
    const urgentCases = await Case.find({
      filingDeadline: { $gte: now, $lte: sevenDays },
      stage: { $nin: ['Approved', 'Rejected', 'RFE Issued'] },
    });

    for (const c of urgentCases) {
      if (c.assignedManager) {
        await createInternal(c.assignedManager, 'filing_deadline', 'Filing Deadline Approaching', `Case ${c.caseId}: filing deadline in 7 days or less.`, `/cases/${c._id}`);
      }
    }

    // 4. Inactivity check — users with no work logged today
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const activeUsers = await User.find({ isActive: true, role: 'user' });
    for (const user of activeUsers) {
      const count = await WorkUnit.countDocuments({ userId: user._id, date: { $gte: todayStart } });
      if (count === 0) {
        // Notify their admin
        const admin = await User.findOne({ team: user.team, role: 'admin', isActive: true });
        if (admin) {
          await createInternal(admin._id, 'inactivity', 'Team Member Inactive', `${user.name} has not logged any work today.`, `/team`);
        }
      }
    }
  });

  // ── KPI weekly miss check — Sunday 11:00 PM ───────────────
  cron.schedule('0 23 * * 0', async () => {
    const now = new Date();
    const weekNumber = getISOWeek(now);
    const year = now.getFullYear();

    const targets = await KpiTarget.find({ period: 'weekly', year, weekNumber })
      .populate('userId', '_id name email');

    for (const t of targets) {
      const pct = t.targetValue ? (t.currentValue / t.targetValue) * 100 : 100;
      if (pct < 70 && t.userId) {
        await createInternal(
          t.userId._id,
          'kpi_miss',
          'Weekly KPI Target Missed',
          `You reached ${Math.round(pct)}% of your weekly ${t.metric} target (${t.currentValue}/${t.targetValue}).`,
          '/reports'
        );
      }
    }
  });

  console.log('[CRON] Jobs scheduled');
}

module.exports = startCronJobs;
