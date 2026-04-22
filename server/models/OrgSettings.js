const mongoose = require('mongoose');
const { Schema } = mongoose;

const orgSettingsSchema = new Schema({
  ceoZoomLink:       { type: String, default: '' },
  companyName:       { type: String, default: 'Immigration Services' },
  eodReportTime:     { type: String, default: '18:00' },
  emailNotifications:{ type: Boolean, default: false },
  smtpHost:          { type: String },
  smtpPort:          { type: Number },
  smtpUser:          { type: String },
  smtpPass:          { type: String },
  visaCategories:    { type: [String], default: ['EB-2','H-1B','H-4','L-1','O-1','Family-Based','PERM','I-140','I-485'] },
  internalReviewers: { type: [String], default: ['Bhavya', 'Akashdeep'] },
  ghlWebhookSecret:  { type: String, default: '' },
  updatedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  updatedAt:         { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('OrgSettings', orgSettingsSchema);
