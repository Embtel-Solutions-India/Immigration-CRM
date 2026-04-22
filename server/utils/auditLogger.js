const AuditLog = require('../models/AuditLog');

async function logAudit(req, action, entity, entityId, previousValue, newValue) {
  try {
    await AuditLog.create({
      performedBy: req?.user?._id,
      role: req?.user?.role,
      action,
      entity,
      entityId,
      previousValue,
      newValue,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }
}

module.exports = logAudit;
