const OrgSettings = require('../models/OrgSettings');
const logAudit = require('../utils/auditLogger');

async function getOrCreate() {
  let settings = await OrgSettings.findOne();
  if (!settings) settings = await OrgSettings.create({});
  return settings;
}

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreate();
    // Never expose smtp credentials to non-superadmin
    const safe = settings.toObject();
    if (req.user.role !== 'superadmin') {
      delete safe.smtpHost; delete safe.smtpPort; delete safe.smtpUser; delete safe.smtpPass; delete safe.ghlWebhookSecret;
    }
    res.json(safe);
  } catch (e) { next(e); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreate();
    const allowed = ['ceoZoomLink', 'companyName', 'eodReportTime', 'emailNotifications', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'visaCategories', 'internalReviewers', 'ghlWebhookSecret'];
    allowed.forEach(k => { if (req.body[k] !== undefined) settings[k] = req.body[k]; });
    settings.updatedBy = req.user._id;
    settings.updatedAt = new Date();
    await settings.save();
    await logAudit(req, 'org_settings_updated', 'OrgSettings', settings._id, null, Object.keys(req.body));
    res.json(settings);
  } catch (e) { next(e); }
};

exports.addVisaCategory = async (req, res, next) => {
  try {
    const settings = await getOrCreate();
    const { category } = req.body;
    if (!settings.visaCategories.includes(category)) {
      settings.visaCategories.push(category);
      await settings.save();
    }
    res.json(settings.visaCategories);
  } catch (e) { next(e); }
};

exports.addReviewer = async (req, res, next) => {
  try {
    const settings = await getOrCreate();
    const { name } = req.body;
    if (!settings.internalReviewers.includes(name)) {
      settings.internalReviewers.push(name);
      await settings.save();
    }
    res.json(settings.internalReviewers);
  } catch (e) { next(e); }
};
