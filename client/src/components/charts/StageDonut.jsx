import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1','#3b82f6','#8b5cf6','#06b6d4','#22c55e'];

export default function StageDonut({ data = {} }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        No stage data
      </div>
    );
  }

  return (
    <div>
      {/* Donut — percentage radii scale with the container on any screen size */}
      <div className="h-40 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="32%"
              outerRadius="52%"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend rendered outside the chart so it never overlaps the donut */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3">
        {chartData.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span>{entry.name}:</span>
            <span className="font-semibold text-gray-800">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
