const mongoose = require('mongoose');
const { Schema } = mongoose;

const leaveRequestSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dates:      [{ type: Date, required: true }],
  type:       { type: String, enum: ['full_day', 'half_day'], required: true },
  reason:     { type: String },
  status:     { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String },
}, { timestamps: true });

leaveRequestSchema.index({ userId: 1, status: 1 });
leaveRequestSchema.index({ dates: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
