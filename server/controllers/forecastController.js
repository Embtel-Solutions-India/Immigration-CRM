const WorkUnit = require('../models/WorkUnit');
const { subDays, startOfMonth } = require('date-fns');

async function getHistoricalWinRate(stage) {
  const total = await WorkUnit.countDocuments({ kind: 'SalesUnit', leadStage: { $in: [stage, 'Won', 'Lost'] } });
  if (!total) return 0.2;
  const won = await WorkUnit.countDocuments({ kind: 'SalesUnit', leadStage: 'Won' });
  return total ? won / total : 0.2;
}

async function computeForecast(days) {
  const now = new Date();
  const from = subDays(now, 90);

  const units = await WorkUnit.find({ kind: 'SalesUnit', date: { $gte: from, $lte: now } });

  const hotLeads   = units.filter(u => u.leadStage === 'Hot');
  const warmLeads  = units.filter(u => u.leadStage === 'Warm');
  const recentLeads = units.filter(u => u.date >= subDays(now, 7));

  const avgDeal = units.filter(u => u.dealValue > 0).reduce((s, u, _, a) => s + u.dealValue / a.length, 0) || 3000;

  const hotWinRate  = await getHistoricalWinRate('Hot');
  const warmWinRate = await getHistoricalWinRate('Warm');

  const dailyConversionRate = recentLeads.length / 7;
  const periodMultiplier = days / 30;

  const hotForecast  = hotLeads.length  * avgDeal * hotWinRate  * periodMultiplier;
  const warmForecast = warmLeads.length * avgDeal * warmWinRate * periodMultiplier;
  const pipelineForecast = dailyConversionRate * days * avgDeal * 0.15;

  const total = hotForecast + warmForecast + pipelineForecast;

  const dataPoints = units.length;
  const confidence = dataPoints >= 50 ? 'high' : dataPoints >= 20 ? 'medium' : 'low';

  return { days, forecast: Math.round(total), hotForecast: Math.round(hotForecast), warmForecast: Math.round(warmForecast), pipelineForecast: Math.round(pipelineForecast), confidence, avgDealSize: Math.round(avgDeal), hotWinRate: +(hotWinRate * 100).toFixed(1), warmWinRate: +(warmWinRate * 100).toFixed(1) };
}

exports.getForecast = async (req, res, next) => {
  try {
    const period = parseInt(req.query.period) || 30;
    const [f7, f14, f30] = await Promise.all([computeForecast(7), computeForecast(14), computeForecast(30)]);
    res.json({ requested: await computeForecast(period), precomputed: { days7: f7, days14: f14, days30: f30 } });
  } catch (e) { next(e); }
};

exports.getConfidence = async (req, res, next) => {
  try {
    const from = subDays(new Date(), 90);
    const count = await WorkUnit.countDocuments({ kind: 'SalesUnit', date: { $gte: from } });
    const confidence = count >= 50 ? 'high' : count >= 20 ? 'medium' : 'low';
    res.json({ confidence, dataPoints: count });
  } catch (e) { next(e); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = startOfMonth(d);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const units = await WorkUnit.find({ kind: 'SalesUnit', leadStage: 'Won', date: { $gte: start, $lte: end } });
      const actual = units.reduce((s, u) => s + (u.dealValue || 0), 0);
      months.push({ month: start.toISOString().slice(0, 7), actual: Math.round(actual) });
    }
    res.json(months);
  } catch (e) { next(e); }
};
