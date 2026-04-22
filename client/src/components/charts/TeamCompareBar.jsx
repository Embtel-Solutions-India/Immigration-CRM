import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const COLORS = { Sales: '#3b82f6', Marketing: '#8b5cf6', Production: '#22c55e' };

export default function TeamCompareBar({ scores = {} }) {
  const data = Object.entries(scores).map(([team, score]) => ({ team, score }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="team" tick={{ fontSize: 12 }} width={85} />
        <Tooltip />
        <Bar dataKey="score" radius={[0,4,4,0]}>
          <LabelList dataKey="score" position="right" style={{ fontSize: 12, fontWeight: 600 }} />
          {data.map(d => <Cell key={d.team} fill={COLORS[d.team] || '#6366f1'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
