import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { getLeaderboard } from '../../api/orgApi.js';
import Spinner from '../../components/common/Spinner.jsx';

const RANK_STYLES = [
  'bg-yellow-50 border-yellow-300 text-yellow-700',
  'bg-gray-50 border-gray-300 text-gray-600',
  'bg-orange-50 border-orange-300 text-orange-600',
];

const METRICS = [
  { key: 'dealValue',  label: 'Revenue' },
  { key: 'dealsWon',  label: 'Deals Won' },
  { key: 'callsMade', label: 'Calls Made' },
  { key: 'emailsSent',label: 'Emails Sent' },
];

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [metric, setMetric] = useState('dealValue');
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard({ metric, period })
      .then(res => setData(res.leaderboard || []))
      .finally(() => setLoading(false));
  }, [metric, period]);

  const formatValue = (val) =>
    metric === 'dealValue' ? `$${(val || 0).toLocaleString()}` : (val || 0).toString();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Sales Leaderboard</h1>
        </div>
        <div className="flex gap-1">
          {['weekly','monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${period === p ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${metric === m.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <div key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-shadow hover:shadow-md ${i < 3 ? RANK_STYLES[i] : 'bg-white border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {i + 1}
              </div>
              <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {entry.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{entry.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">{formatValue(entry[metric])}</p>
                <p className="text-xs text-gray-500 capitalize">{METRICS.find(m => m.key === metric)?.label}</p>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="card p-10 text-center text-gray-400">No data for this period</div>
          )}
        </div>
      )}
    </div>
  );
}
