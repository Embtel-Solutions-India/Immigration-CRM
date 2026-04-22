const ActivityLog = require('../models/ActivityLog');

async function logActivity(userId, team, action, entityType, entityId, meta = {}) {
  try {
    await ActivityLog.create({ userId, team, action, entityType, entityId, meta });
  } catch (e) {
    console.error('Activity log failed:', e.message);
  }
}

module.exports = logActivity;
