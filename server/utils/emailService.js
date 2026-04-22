const nodemailer = require('nodemailer');
const OrgSettings = require('../models/OrgSettings');

async function getTransporter() {
  const settings = await OrgSettings.findOne();
  if (!settings?.smtpHost || !settings?.smtpUser) return null;
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpPort === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });
}

async function sendEodEmail(user, report) {
  const transport = await getTransporter();
  if (!transport) return;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1d4ed8">End of Day Report — ${new Date(report.date).toDateString()}</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr style="background:#f8fafc"><td style="padding:8px 12px;border:1px solid #e2e8f0">Tasks Completed</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600">${report.tasksCompleted}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e2e8f0">Total Time Spent</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600">${report.totalTimeSpent} min</td></tr>
        <tr style="background:#f8fafc"><td style="padding:8px 12px;border:1px solid #e2e8f0">Calls Made</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600">${report.callsMade}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e2e8f0">Emails Sent</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600">${report.emailsSent}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:8px 12px;border:1px solid #e2e8f0">Leads Updated</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600">${report.leadsUpdated}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e2e8f0">Cases Moved</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600">${report.casesMoved}</td></tr>
      </table>
      <p style="color:#64748b;font-size:13px;margin-top:24px">ImmigrationCRM — automated report</p>
    </div>`;

  await transport.sendMail({
    from: `"ImmigrationCRM" <${(await OrgSettings.findOne())?.smtpUser}>`,
    to: user.email,
    subject: `EOD Report — ${new Date(report.date).toDateString()}`,
    html,
  });
}

async function sendNotificationEmail(to, subject, message) {
  const transport = await getTransporter();
  if (!transport) return;
  await transport.sendMail({
    from: `"ImmigrationCRM" <${(await OrgSettings.findOne())?.smtpUser}>`,
    to,
    subject,
    html: `<div style="font-family:sans-serif;max-width:500px"><p>${message}</p></div>`,
  });
}

module.exports = { sendEodEmail, sendNotificationEmail };
