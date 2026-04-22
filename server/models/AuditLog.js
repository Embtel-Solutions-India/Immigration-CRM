const mongoose = require('mongoose');
const { Schema } = mongoose;

// Append-only. No update or delete endpoints are ever exposed for this collection.
const auditLogSchema = new Schema({
  performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  role:        { type: String },
  action:      { type: String, required: true },
  entity:      { type: String, required: true },
  entityId:    { type: Schema.Types.ObjectId },
  previousValue: { type: Schema.Types.Mixed },
  newValue:    { type: Schema.Types.Mixed },
  ipAddress:   { type: String },
  userAgent:   { type: String },
  timestamp:   { type: Date, default: Date.now },
});

auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
