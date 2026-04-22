const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_deadline', 'lead_cold', 'case_stuck', 'filing_deadline', 'inactivity', 'kpi_miss', 'leave_update', 'general'],
    required: true,
  },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  linkTo:    { type: String },
  isRead:    { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
