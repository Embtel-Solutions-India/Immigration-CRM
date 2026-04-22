import React from 'react';

function getColor(pct) {
  if (pct > 100) return { stroke: '#3b82f6', text: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 71)  return { stroke: '#22c55e', text: 'text-green-600', bg: 'bg-green-50' };
  if (pct >= 41)  return { stroke: '#f59e0b', text: 'text-amber-600', bg: 'bg-amber-50' };
  return           { stroke: '#ef4444', text: 'text-red-600', bg: 'bg-red-50' };
}

export default function KpiProgressRing({ label, current, target, size = 80 }) {
  const pct = target ? Math.round((current / target) * 100) : 0;
  const { stroke, text, bg } = getColor(pct);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min((pct / 100) * circ, circ);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`rounded-full ${bg} p-1`}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text
            x="50%" y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="rotate-90"
            style={{ transform: `rotate(90deg)`, transformOrigin: '50% 50%', fontSize: size < 70 ? 11 : 13, fontWeight: 700, fill: stroke }}
          >
            {Math.min(pct, 999)}%
          </text>
        </svg>
      </div>
      <p className="text-xs text-gray-500 text-center leading-tight max-w-20">{label}</p>
      <p className={`text-xs font-semibold ${text}`}>{current}/{target}</p>
    </div>
  );
}
