import React from 'react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am–8pm
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function intensity(count, max) {
  if (!count || !max) return 'bg-gray-100';
  const pct = count / max;
  if (pct > 0.75) return 'bg-brand-700';
  if (pct > 0.5)  return 'bg-brand-500';
  if (pct > 0.25) return 'bg-brand-300';
  return 'bg-brand-100';
}

export default function HeatmapChart({ data = [] }) {
  const max = Math.max(...data.flatMap(d => d.hours.map(h => h.count)), 1);

  const lookup = {};
  data.forEach(d => {
    d.hours.forEach(h => { lookup[`${d.day}-${h.hour}`] = h.count; });
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1 mb-1 ml-10">
          {HOURS.map(h => (
            <div key={h} className="w-7 text-center text-xs text-gray-400">{h}</div>
          ))}
        </div>
        {DAYS.map(day => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <div className="w-8 text-xs text-gray-500 text-right pr-2">{day}</div>
            {HOURS.map(h => {
              const count = lookup[`${day}-${h}`] || 0;
              return (
                <div
                  key={h}
                  title={`${day} ${h}:00 — ${count} task${count !== 1 ? 's' : ''}`}
                  className={`w-7 h-7 rounded-sm ${intensity(count, max)} transition-colors cursor-default`}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 ml-10">
          <span className="text-xs text-gray-400">Less</span>
          {['bg-gray-100','bg-brand-100','bg-brand-300','bg-brand-500','bg-brand-700'].map(c => (
            <div key={c} className={`w-5 h-5 rounded-sm ${c}`} />
          ))}
          <span className="text-xs text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}
