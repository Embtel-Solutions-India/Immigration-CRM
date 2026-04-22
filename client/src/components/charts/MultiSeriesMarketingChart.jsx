import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getMarketingOrgChart, getMarketingTeamChart, getMarketingUserChart } from '../../api/chartsApi.js';
import Spinner from '../common/Spinner.jsx';

const COLORS = ['#8b5cf6','#06b6d4','#ec4899','#22c55e','#f59e0b'];
const METRIC_LABELS = { emailsSent: 'Emails Sent', leadsGenerated: 'Leads Generated' };

export default function MultiSeriesMarketingChart({ view = 'org', entityId }) {
  const [data, setData] = useState([]);
  const [series, setSeries] = useState([]);
  const [metric, setMetric] = useState('emailsSent');
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState({});
  const month = new Date().getMonth() + 1;
  const year  = new Date().getFullYear();

  useEffect(() => {
    setLoading(true);
    const params = { month, year, metric };
    const fetcher = view === 'org'
      ? getMarketingOrgChart(params)
      : view === 'team'
        ? getMarketingTeamChart(entityId || 'Marketing', params)
        : getMarketingUserChart(entityId, params);

    fetcher.then(res => {
      if (view === 'org') {
        setData(res.data || []);
        setSeries(['Marketing']);
      } else if (view === 'team') {
        const members = res.members || [];
        setSeries(members.map(m => m.name));
        const days = Object.values(res.series || {})[0]?.length || 31;
        const merged = Array.from({ length: days }, (_, i) => {
          const row = { day: i + 1 };
          members.forEach(m => { row[m.name] = res.series[m.name]?.[i]?.value || 0; });
          return row;
        });
        setData(merged);
      } else {
        setData((res.daily || []).map(d => ({ day: d.day, Me: d.value })));
        setSeries(['Me']);
      }
    }).finally(() => setLoading(false));
  }, [view, entityId, metric, month, year]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(METRIC_LABELS).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setMetric(k)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${metric === k ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
        {series.map((s, i) => (
          <button key={s} onClick={() => setHidden(h => ({ ...h, [s]: !h[s] }))}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border ${hidden[s] ? 'opacity-40' : ''}`}
            style={{ borderColor: COLORS[i % COLORS.length] }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {series.map((s, i) => !hidden[s] && (
              <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
