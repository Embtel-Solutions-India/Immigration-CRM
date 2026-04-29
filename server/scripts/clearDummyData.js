/**
 * Clears all dummy/seed data except Users and OrgSettings.
 * Run: node scripts/clearDummyData.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crm-portal')
  .then(() => console.log('Connected'))
  .catch(e => { console.error(e.message); process.exit(1); });

const WorkUnit    = require('../models/WorkUnit');
const Case        = require('../models/Case');
const KpiTarget   = require('../models/KpiTarget');
const LeaveRequest= require('../models/LeaveRequest');
const EodReport   = require('../models/EodReport');
const Notification= require('../models/Notification');
const WebhookLog  = require('../models/WebhookLog');
const AuditLog    = require('../models/AuditLog');

async function clear() {
  const results = await Promise.all([
    WorkUnit.deleteMany({}).then(r => `WorkUnits: ${r.deletedCount} deleted`),
    Case.deleteMany({}).then(r => `Cases: ${r.deletedCount} deleted`),
    KpiTarget.deleteMany({}).then(r => `KpiTargets: ${r.deletedCount} deleted`),
    LeaveRequest.deleteMany({}).then(r => `LeaveRequests: ${r.deletedCount} deleted`),
    EodReport.deleteMany({}).then(r => `EodReports: ${r.deletedCount} deleted`),
    Notification.deleteMany({}).then(r => `Notifications: ${r.deletedCount} deleted`),
    WebhookLog.deleteMany({}).then(r => `WebhookLogs: ${r.deletedCount} deleted`),
    AuditLog.deleteMany({}).then(r => `AuditLogs: ${r.deletedCount} deleted`),
  ]);
  results.forEach(r => console.log(r));
  console.log('\nDone. Users and OrgSettings preserved.');
  await mongoose.disconnect();
}

clear().catch(e => { console.error(e); process.exit(1); });
