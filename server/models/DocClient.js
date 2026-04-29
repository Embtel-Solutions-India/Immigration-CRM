const mongoose = require('mongoose');
const { Schema } = mongoose;

const SERVICE_TYPES = ['Bookkeeping', 'Tax Filing', 'Payroll', 'Financial Reports', 'Compliance', 'Auditing', 'Other'];

const docClientSchema = new Schema({
  name:               { type: String, required: true, trim: true },
  email:              { type: String, required: true, lowercase: true, trim: true },
  mobile:             { type: String, required: true, trim: true },
  address:            { type: String, required: true, trim: true },
  serviceType:        { type: String, enum: SERVICE_TYPES, default: 'Bookkeeping' },
  assignedTo:         { type: Schema.Types.ObjectId, ref: 'User' },
  amountPaid:         { type: Number, default: 0 },
  totalWorkValue:     { type: Number, default: 0 },
  workCompletedValue: { type: Number, default: 0 },
  status:             { type: String, enum: ['Active', 'Inactive', 'Completed'], default: 'Active' },
  notes:              { type: String },
  customFields:       [{ key: { type: String }, value: { type: String } }],
  createdBy:          { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

docClientSchema.index({ assignedTo: 1 });
docClientSchema.index({ status: 1 });

module.exports = mongoose.model('DocClient', docClientSchema);
