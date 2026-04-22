const mongoose = require('mongoose');
const { Schema } = mongoose;

const activityLogSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  team:       { type: String },
  action:     { type: String, required: true },
  entityType: { type: String },
  entityId:   { type: Schema.Types.ObjectId },
  meta:       { type: Schema.Types.Mixed },
  createdAt:  { type: Date, default: Date.now },
});

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ team: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
