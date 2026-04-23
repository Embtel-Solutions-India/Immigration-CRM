import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ReferenceDot, ResponsiveContainer
} from 'recharts';
import { getSalesOrgChart, getSalesTeamChart, getSalesUserChart } from '../../api/chartsApi.js';
import Spinner from '../common/Spinner.jsx';

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899'];

export default function MultiSeriesSalesChart({ view = 'org', entityId, isAdmin, isSuperAdmin }) {
  const [data, setData] = useState([]);
  const [series, setSeries] = useState([]);
  const [weekTargets, setWeekTargets] = useState([]);
  const [metric, setMetric] = useState('dealValue');
  const [loading, setLoading] = useState(true);
  const [activeSeries, setActiveSeries] = useState([]);
  const month = new Date().getMonth() + 1;
  const year  = new Date().getFullYear();

  const METRIC_LABELS = { dealValue: 'Revenue ($)', callsMade: 'Calls Made', emailsSent: 'Emails Sent' };

  useEffect(() => {
    setLoading(true);
    const params = { month, year, metric };

    const fetcher = view === 'org'
      ? getSalesOrgChart(params)
      : view === 'team'
        ? getSalesTeamChart(entityId || 'Sales', params)
        : getSalesUserChart(entityId, params);

    fetcher.then(res => {
      if (view === 'org') {
        const nextSeries = ['Sales'];
        setData(res.data || []);
        setSeries(nextSeries);
        setActiveSeries(nextSeries);
        setWeekTargets(res.weekTargets || []);
      } else if (view === 'team') {
        const members = res.members || [];
        const nextSeries = members.map(m => m.name);
        setSeries(nextSeries);
        // Default behavior on load: show all team members.
        setActiveSeries(nextSeries);
        const days = Object.values(res.series || {})[0]?.length || 31;
        const merged = Array.from({ length: days }, (_, i) => {
          const row = { day: i + 1 };
          members.forEach(m => { row[m.name] = (res.series[m.name]?.[i]?.value) || 0; });
          return row;
        });
        setData(merged);
        setWeekTargets([]);
      } else {
        const nextSeries = ['Me'];
        setData((res.daily || []).map(d => ({ day: d.day, Me: d.value })));
        setSeries(nextSeries);
        setActiveSeries(nextSeries);
        setWeekTargets(res.weekTargets || []);
      }
    }).finally(() => setLoading(false));
  }, [view, entityId, metric, month, year]);

  const selectSeries = (name) => {
    setActiveSeries(prev => {
      // If currently showing all, first click should isolate the selected user.
      if (prev.length === series.length && prev.includes(name)) {
        return [name];
      }
      if (prev.includes(name)) {
        // Keep at least one active series visible.
        return prev.length > 1 ? prev.filter(s => s !== name) : prev;
      }
      return [...prev, name];
    });
  };

  const selectAllSeries = () => {
    setActiveSeries(prev =>
      prev.length === series.length ? series.slice(0, 1) : series
    );
  };

  const mergedData = data.map(d => {
    const target = weekTargets.find(t => t.day === d.day);
    return target ? { ...d, _target: target.targetValue } : d;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {Object.entries(METRIC_LABELS).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMetric(k)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${metric === k ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {series.length > 1 && (
            <button
              onClick={selectAllSeries}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-opacity ${
                activeSeries.length === series.length ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
          )}
          {series.map((s, i) => (
            <button
              key={s}
              onClick={() => selectSeries(s)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-opacity ${
                activeSeries.includes(s) ? '' : 'opacity-40'
              }`}
              style={{ borderColor: COLORS[i % COLORS.length] }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={mergedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold mb-1">Day {label}</p>
                    {payload.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-gray-600">{p.name}:</span>
                        <span className="font-medium">{p.name === '_target' ? `Target: ${p.value}` : p.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {series.map((s, i) => activeSeries.includes(s) && (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            {weekTargets.map(t => (
              <ReferenceDot
                key={t.day}
                x={t.day}
                y={t.targetValue}
                r={5}
                fill="#f97316"
                stroke="white"
                strokeWidth={2}
                label={{ value: 'Target', position: 'top', fontSize: 9, fill: '#f97316' }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
