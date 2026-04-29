const mongoose = require('mongoose');
const { Schema } = mongoose;

const SERVICE_TYPES = ['Bookkeeping', 'Tax Filing', 'Payroll', 'Financial Reports', 'Compliance', 'Auditing', 'Other'];
const DEFAULT_STAGES = ['Checklist Sent', 'Documents Received', 'Missing Documents', 'Under Review', 'Work In Progress', 'Completed'];

const docCaseSchema = new Schema({
  clientId:      { type: Schema.Types.ObjectId, ref: 'DocClient', required: true },
  title:         { type: String, required: true, trim: true },
  serviceType:   { type: String, enum: SERVICE_TYPES, default: 'Bookkeeping' },
  status:        { type: String, enum: ['Open', 'In Progress', 'Under Review', 'Completed', 'Closed'], default: 'Open' },
  workflowStage: { type: String, enum: DEFAULT_STAGES, default: 'Checklist Sent' },
  customStages:  [{ type: String }],
  progress:      { type: Number, default: 0, min: 0, max: 100 },
  assignedTo:    { type: Schema.Types.ObjectId, ref: 'User' },
  deadline:      { type: Date },
  payment: {
    totalAmount: { type: Number, default: 0 },
    amountPaid:  { type: Number, default: 0 },
  },
  workValue: {
    total:     { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
  },
  notes:     { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

docCaseSchema.index({ clientId: 1 });
docCaseSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('DocCase', docCaseSchema);
