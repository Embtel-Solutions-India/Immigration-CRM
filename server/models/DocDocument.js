const mongoose = require('mongoose');
const { Schema } = mongoose;

const DEFAULT_DOC_TYPES = [
  'Bank Statements', 'Tax Returns', 'Payroll Records', 'Financial Statements',
  'Invoices', 'Receipts', 'Balance Sheet', 'Income Statement', 'Audit Report',
  'Compliance Certificate', 'Business Registration', 'Identity Document', 'Other',
];

const docDocumentSchema = new Schema({
  clientId:   { type: Schema.Types.ObjectId, ref: 'DocClient', required: true },
  caseId:     { type: Schema.Types.ObjectId, ref: 'DocCase' },
  name:       { type: String, required: true, trim: true },
  docType:    { type: String, default: 'Other' },
  isRequired: { type: Boolean, default: false },
  status:     { type: String, enum: ['Pending', 'Submitted', 'Approved', 'Rejected', 'Missing'], default: 'Pending' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  uploadDate: { type: Date },
  fileUrl:    { type: String },
  fileName:   { type: String },
  notes:      { type: String },
  isCustom:   { type: Boolean, default: false },
}, { timestamps: true });

docDocumentSchema.index({ clientId: 1, status: 1 });
docDocumentSchema.index({ caseId: 1 });

module.exports = mongoose.model('DocDocument', docDocumentSchema);
module.exports.DEFAULT_DOC_TYPES = DEFAULT_DOC_TYPES;
