const mongoose = require('mongoose');
const { Schema } = mongoose;

const WORKFLOW_STAGES = [
  'Checklist Sent', 'Documents Received', 'Missing Documents',
  'Under Review', 'Work In Progress', 'Completed',
];

const itemSchema = new Schema({
  label:     { type: String, required: true },
  completed: { type: Boolean, default: false },
  required:  { type: Boolean, default: false },
  isCustom:  { type: Boolean, default: false },
  order:     { type: Number, default: 0 },
}, { _id: true });

const docChecklistSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'DocClient', required: true },
  caseId:   { type: Schema.Types.ObjectId, ref: 'DocCase' },
  stage:    { type: String, enum: WORKFLOW_STAGES, default: 'Checklist Sent' },
  items:    [itemSchema],
}, { timestamps: true });

docChecklistSchema.index({ clientId: 1 });
docChecklistSchema.index({ caseId: 1 });

module.exports = mongoose.model('DocChecklist', docChecklistSchema);
module.exports.WORKFLOW_STAGES = WORKFLOW_STAGES;
