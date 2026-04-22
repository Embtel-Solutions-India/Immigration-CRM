const mongoose = require('mongoose');
const { Schema } = mongoose;

const STAGES = [
  'Document Collection',
  'Application Drafted',
  'Internal Team Review',
  'Client Review',
  'Petition Filed',
  'Under Government Review',
  'Approved',
  'Rejected',
  'RFE Issued',
];

const stageHistorySchema = new Schema({
  stage:   { type: String },
  movedAt: { type: Date, default: Date.now },
  movedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes:   { type: String },
}, { _id: true });

const documentSchema = new Schema({
  name:       { type: String },
  url:        { type: String },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: true });

const caseSchema = new Schema({
  caseId:           { type: String, unique: true },
  clientName:       { type: String, required: true },
  clientEmail:      { type: String },
  clientPhone:      { type: String },
  visaCategory:     { type: String, required: true },
  stage: {
    type: String,
    enum: STAGES,
    default: 'Document Collection',
  },
  assignedManager:    { type: Schema.Types.ObjectId, ref: 'User' },
  internalReviewer:   { type: String },
  filingDeadline:     { type: Date },
  slaDeadline:        { type: Date },
  stageEnteredAt:     { type: Date, default: Date.now },
  priority:           { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
  notes:              { type: String },
  stageHistory:       [stageHistorySchema],
  documents:          [documentSchema],
  statusUpdates: [{
    note:      { type: String },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  sourceLeadId:   { type: Schema.Types.ObjectId },
  source:         { type: String, enum: ['manual', 'gohighlevel'], default: 'manual' },
  ghlContactId:   { type: String },
}, { timestamps: true });

caseSchema.index({ stage: 1, slaDeadline: 1 });
caseSchema.index({ assignedManager: 1, stage: 1 });
caseSchema.index({ caseId: 1 });
caseSchema.index({ visaCategory: 1 });

caseSchema.virtual('daysInCurrentStage').get(function () {
  if (!this.stageEnteredAt) return 0;
  return Math.floor((Date.now() - this.stageEnteredAt) / 86400000);
});

caseSchema.virtual('isOverdue').get(function () {
  if (!this.slaDeadline) return false;
  const terminal = ['Approved', 'Rejected', 'RFE Issued'];
  if (terminal.includes(this.stage)) return false;
  return new Date() > new Date(this.slaDeadline);
});

caseSchema.set('toJSON', { virtuals: true });
caseSchema.set('toObject', { virtuals: true });

caseSchema.pre('save', async function (next) {
  if (!this.caseId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Case').countDocuments();
    this.caseId = `IMM-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);
module.exports.STAGES = STAGES;
