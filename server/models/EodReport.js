const mongoose = require('mongoose');
const { Schema } = mongoose;

const eodReportSchema = new Schema({
  userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:           { type: Date, required: true },
  tasksCompleted: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  leadsUpdated:   { type: Number, default: 0 },
  emailsSent:     { type: Number, default: 0 },
  callsMade:      { type: Number, default: 0 },
  casesMoved:     { type: Number, default: 0 },
  rawSummary:     { type: Schema.Types.Mixed },
  emailSentAt:    { type: Date },
  generatedAt:    { type: Date, default: Date.now },
}, { timestamps: false });

eodReportSchema.index({ userId: 1, date: -1 });
eodReportSchema.index({ date: -1 });

module.exports = mongoose.model('EodReport', eodReportSchema);
