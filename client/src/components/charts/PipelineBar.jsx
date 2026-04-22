import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = { Hot: '#ef4444', Warm: '#f97316', Cold: '#3b82f6', Won: '#22c55e', Lost: '#9ca3af' };

export default function PipelineBar({ data = {} }) {
  const chartData = Object.entries(data).map(([name, count]) => ({ name, count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" radius={[4,4,0,0]}>
          {chartData.map(entry => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#6366f1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
