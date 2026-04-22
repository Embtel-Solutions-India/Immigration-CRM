const mongoose = require('mongoose');
const { Schema } = mongoose;

const webhookLogSchema = new Schema({
  platform:     { type: String, default: 'gohighlevel' },
  eventType:    { type: String },
  rawPayload:   { type: Schema.Types.Mixed },
  processedAt:  { type: Date },
  status:       { type: String, enum: ['success', 'failed', 'retrying', 'pending'], default: 'pending' },
  errorMessage: { type: String },
  retryCount:   { type: Number, default: 0 },
  receivedAt:   { type: Date, default: Date.now },
});

webhookLogSchema.index({ status: 1, receivedAt: -1 });
webhookLogSchema.index({ eventType: 1, receivedAt: -1 });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
