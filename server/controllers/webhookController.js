const crypto = require('crypto');
const WebhookLog = require('../models/WebhookLog');
const WorkUnit = require('../models/WorkUnit');
const OrgSettings = require('../models/OrgSettings');

function verifySignature(secret, rawBody, signature) {
  if (!secret || !signature) return true; // Skip if not configured
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

async function processEvent(log) {
  const { eventType, rawPayload } = log;
  try {
    if (eventType === 'contact.created' || eventType === 'contact.updated') {
      await WorkUnit.findOneAndUpdate(
        { 'ghlContactId': rawPayload.id, kind: 'SalesUnit' },
        {
          $setOnInsert: {
            kind: 'SalesUnit', team: 'Sales', workType: 'lead_update',
            title: `GHL Lead: ${rawPayload.firstName || ''} ${rawPayload.lastName || ''}`.trim(),
            userId: null, source: 'gohighlevel',
          },
          $set: {
            ghlContactId: rawPayload.id,
            contactName: `${rawPayload.firstName || ''} ${rawPayload.lastName || ''}`.trim(),
            contactEmail: rawPayload.email,
            contactPhone: rawPayload.phone,
            lastSyncedAt: new Date(),
          }
        },
        { upsert: true }
      );
    }

    if (eventType === 'opportunity.statusChanged' || eventType === 'opportunity.stageChanged') {
      const stageMap = {
        'won': 'Won', 'lost': 'Lost',
        'open': 'Warm', 'new': 'Hot',
      };
      const leadStage = stageMap[rawPayload.status?.toLowerCase()] || 'Warm';
      await WorkUnit.updateMany(
        { ghlContactId: rawPayload.contactId, kind: 'SalesUnit' },
        { $set: { leadStage, ghlOpportunityId: rawPayload.id, lastSyncedAt: new Date() } }
      );
    }

    if (eventType === 'email.sent') {
      await WorkUnit.findOneAndUpdate(
        { ghlCampaignId: rawPayload.campaignId, kind: 'MarketingUnit' },
        { $inc: { emailsSent: 1 }, $set: { lastSyncedAt: new Date() } }
      );
    }

    if (eventType === 'email.opened') {
      const campaign = await WorkUnit.findOne({ ghlCampaignId: rawPayload.campaignId, kind: 'MarketingUnit' });
      if (campaign && campaign.emailsSent > 0) {
        const newOpenCount = (campaign.openCount || 0) + 1;
        campaign.openRate = Math.round((newOpenCount / campaign.emailsSent) * 100);
        campaign.openCount = newOpenCount;
        await campaign.save();
      }
    }

    if (eventType === 'email.clicked') {
      const campaign = await WorkUnit.findOne({ ghlCampaignId: rawPayload.campaignId, kind: 'MarketingUnit' });
      if (campaign && campaign.emailsSent > 0) {
        const newClickCount = (campaign.clickCount || 0) + 1;
        campaign.clickRate = Math.round((newClickCount / campaign.emailsSent) * 100);
        campaign.clickCount = newClickCount;
        await campaign.save();
      }
    }

    log.status = 'success';
    log.processedAt = new Date();
    await log.save();
  } catch (e) {
    log.status = log.retryCount >= 3 ? 'failed' : 'retrying';
    log.errorMessage = e.message;
    log.retryCount = (log.retryCount || 0) + 1;
    await log.save();
    if (log.retryCount < 3) {
      setTimeout(() => processEvent(log), 1000 * Math.pow(2, log.retryCount));
    }
  }
}

exports.receive = async (req, res) => {
  // Return 200 immediately, process async
  res.status(200).json({ received: true });

  try {
    const settings = await OrgSettings.findOne();
    const secret = settings?.ghlWebhookSecret;
    const signature = req.headers['x-ghl-signature'];
    const rawBody = JSON.stringify(req.body);

    if (secret && !verifySignature(secret, rawBody, signature)) {
      await WebhookLog.create({
        eventType: 'INVALID_SIGNATURE', rawPayload: req.body,
        status: 'failed', errorMessage: 'Signature verification failed',
      });
      return;
    }

    const eventType = req.body.type || req.body.event || 'unknown';
    const log = await WebhookLog.create({
      platform: 'gohighlevel', eventType, rawPayload: req.body, status: 'pending',
    });

    setImmediate(() => processEvent(log));
  } catch (e) {
    console.error('Webhook processing error:', e.message);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    const { status, event, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (event) filter.eventType = event;
    if (from || to) {
      filter.receivedAt = {};
      if (from) filter.receivedAt.$gte = new Date(from);
      if (to) filter.receivedAt.$lte = new Date(to);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      WebhookLog.find(filter).sort({ receivedAt: -1 }).skip(skip).limit(parseInt(limit)),
      WebhookLog.countDocuments(filter),
    ]);
    res.json({ logs, total, page: parseInt(page) });
  } catch (e) { next(e); }
};

exports.retry = async (req, res, next) => {
  try {
    const log = await WebhookLog.findById(req.params.logId);
    if (!log) return res.status(404).json({ error: 'Not found' });
    log.status = 'retrying';
    log.retryCount = 0;
    await log.save();
    processEvent(log);
    res.json({ message: 'Retry initiated' });
  } catch (e) { next(e); }
};

exports.integrationStatus = async (req, res, next) => {
  try {
    const last = await WebhookLog.findOne({ platform: 'gohighlevel' }).sort({ receivedAt: -1 });
    const total = await WebhookLog.countDocuments({ platform: 'gohighlevel' });
    const success = await WebhookLog.countDocuments({ platform: 'gohighlevel', status: 'success' });
    res.json({
      lastEventAt: last?.receivedAt || null,
      successRate: total ? Math.round((success / total) * 100) : 0,
      totalEvents: total,
    });
  } catch (e) { next(e); }
};
