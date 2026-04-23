const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  authorId:  { type: Schema.Types.ObjectId, ref: 'User' },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const workUnitSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  team:        { type: String, enum: ['Sales', 'Marketing', 'Production', 'HR'], required: true },
  workType:    { type: String, enum: ['task', 'call', 'email', 'case_update', 'campaign', 'lead_update'], required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  startTime:   { type: Date },
  endTime:     { type: Date },
  timerActive: { type: Boolean, default: false },
  status:      { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Blocked'], default: 'Pending' },
  outputValue: { type: Number, default: 0 },
  tags:        [{ type: String }],
  date:        { type: Date, default: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }},
  comments:    [commentSchema],
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String },
}, { timestamps: true, discriminatorKey: 'kind' });

workUnitSchema.index({ userId: 1, date: -1 });
workUnitSchema.index({ team: 1, date: -1, status: 1 });
workUnitSchema.index({ date: -1, status: 1 });

const WorkUnit = mongoose.model('WorkUnit', workUnitSchema);

// ── Sales ──────────────────────────────────────────────────
WorkUnit.discriminator('SalesUnit', new Schema({
  callsMade:        { type: Number, default: 0 },
  emailsSent:       { type: Number, default: 0 },
  leadsAdded:       { type: Number, default: 0 },
  leadStage:        { type: String, enum: ['Hot', 'Warm', 'Cold', 'Won', 'Lost'] },
  dealValue:        { type: Number },
  expectedCloseDate:{ type: Date },
  dailyRevenue:     { type: Number, default: 0 },
  weeklyForecast:   { type: Number },
  contactName:      { type: String },
  contactPhone:     { type: String },
  contactEmail:     { type: String },
}));

// ── Marketing ──────────────────────────────────────────────
WorkUnit.discriminator('MarketingUnit', new Schema({
  campaignType:      { type: String, enum: ['Employer', 'Attorney', 'Individual', 'Bulk'] },
  emailsSent:        { type: Number, default: 0 },
  openRate:          { type: Number },
  clickRate:         { type: Number },
  leadsGenerated:    { type: Number, default: 0 },
  conversionsToSales:{ type: Number, default: 0 },
  campaignCost:      { type: Number },
  campaignName:      { type: String },
}));

// ── Production ─────────────────────────────────────────────
WorkUnit.discriminator('ProductionUnit', new Schema({
  caseId:      { type: Schema.Types.ObjectId, ref: 'Case' },
  clientName:  { type: String },
  caseType:    { type: String },
  stage: {
    type: String,
    enum: ['Received', 'In Progress', 'Review', 'Submitted', 'Delivered'],
    default: 'Received',
  },
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'User' },
  deadline:    { type: Date },
  statusUpdates: [{
    stage:     { type: String },
    note:      { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  }],
}));

// HR
WorkUnit.discriminator('HRUnit', new Schema({
  employeeName: { type: String },
  requestType: { type: String },
  stage: {
    type: String,
    enum: ['Received', 'Screening', 'Interview', 'Documentation', 'Completed'],
    default: 'Received',
  },
  deadline: { type: Date },
}));

module.exports = WorkUnit;
