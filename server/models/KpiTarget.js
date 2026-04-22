const mongoose = require('mongoose');
const { Schema } = mongoose;

const kpiTargetSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  setByAdmin:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  team:         { type: String, enum: ['Sales', 'Marketing', 'Production'], required: true },
  metric:       { type: String, required: true },
  targetValue:  { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  period:       { type: String, enum: ['weekly', 'monthly'], required: true },
  weekNumber:   { type: Number },
  month:        { type: Number },
  year:         { type: Number, required: true },
}, { timestamps: true });

kpiTargetSchema.index({ userId: 1, period: 1, year: 1, weekNumber: 1 });
kpiTargetSchema.index({ userId: 1, period: 1, year: 1, month: 1 });
kpiTargetSchema.index({ team: 1, period: 1, year: 1, weekNumber: 1 });

kpiTargetSchema.virtual('progressPct').get(function () {
  if (!this.targetValue) return 0;
  return Math.round((this.currentValue / this.targetValue) * 100);
});

module.exports = mongoose.model('KpiTarget', kpiTargetSchema);
