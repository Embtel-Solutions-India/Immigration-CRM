function calcProductivityScore(workUnits, hoursTracked, targetHours = 8) {
  if (!workUnits.length) return 0;

  const completed = workUnits.filter(w => w.status === 'Completed').length;
  const completionRate = completed / workUnits.length;

  const timeScore = Math.min(hoursTracked / targetHours, 1);

  const totalOutput = workUnits.reduce((s, w) => s + (w.outputValue || 0), 0);
  const avgOutput = totalOutput / workUnits.length;
  const outputScore = Math.min(avgOutput / 10, 1);

  return Math.round((completionRate * 0.45 + timeScore * 0.35 + outputScore * 0.20) * 100);
}

module.exports = calcProductivityScore;
