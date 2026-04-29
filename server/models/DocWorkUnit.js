const mongoose = require('mongoose');
const { Schema } = mongoose;

const docWorkUnitSchema = new Schema({
  title:         { type: String, required: true, trim: true },
  description:   { type: String },
  clientId:      { type: Schema.Types.ObjectId, ref: 'DocClient', required: true },
  caseId:        { type: Schema.Types.ObjectId, ref: 'DocCase' },
  assignedTo:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status:        { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  value:         { type: Number, default: 0 },
  dueDate:       { type: Date },
  completionPct: { type: Number, default: 0, min: 0, max: 100 },
  createdBy:     { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

docWorkUnitSchema.index({ assignedTo: 1, status: 1 });
docWorkUnitSchema.index({ clientId: 1 });
docWorkUnitSchema.index({ caseId: 1 });

module.exports = mongoose.model('DocWorkUnit', docWorkUnitSchema);
