import React, { useState, useEffect } from 'react';
import { Trophy, Search } from 'lucide-react';
import { getDocLeaderboard } from '../../api/docApi.js';
import Spinner from '../../components/common/Spinner.jsx';

const RANK_STYLES = [
  'bg-yellow-50 border-yellow-300 text-yellow-700',
  'bg-gray-50 border-gray-300 text-gray-600',
  'bg-orange-50 border-orange-300 text-orange-600',
];

const METRICS = [
  { key: 'completedValue', label: 'Work Value ($)' },
  { key: 'completionPct', label: 'Completion %' },
  { key: 'completedWorkUnits', label: 'Tasks Completed' },
  { key: 'docsSubmitted', label: 'Docs Submitted' },
  { key: 'totalClients', label: 'Total Clients' },
];

const TABS = [
  { key: 'all', label: 'All Members' },
  { key: 'top', label: 'Top Performers' },
  { key: 'high_value', label: 'High Value' },
];

function formatValue(metric, val) {
  if (metric === 'completedValue') return `$${(val || 0).toLocaleString()}`;
  if (metric === 'completionPct') return `${Number(val || 0).toFixed(0)}%`;
  return (val || 0).toString();
}

export default function DocLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [metric, setMetric] = useState('completedValue');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    setLoading(true);
    getDocLeaderboard({ period, metric, search })
      .then(r => setData(r.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, metric, search]);

  const filtered = tab === 'top'
    ? data.slice(0, 5)
    : tab === 'high_value'
    ? [...data].sort((a, b) => (b.completedValue || 0) - (a.completedValue || 0)).slice(0, 5)
    : data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Documentation Leaderboard</h1>
        </div>
        <div className="flex gap-1.5">
          {['weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${period === p ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-4">
        {/* Search + Metric filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${metric === m.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry, i) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-shadow hover:shadow-md ${i < 3 ? RANK_STYLES[i] : 'bg-white border-gray-100'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {i + 1}
                </div>
                <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {entry.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{entry.name}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-gray-500">{entry.totalWorkUnits} units</span>
                    <span className="text-xs text-gray-500">{entry.docsSubmitted} docs</span>
                    <span className="text-xs text-gray-500">{entry.totalClients} clients</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-base text-gray-900">{formatValue(metric, entry[metric])}</p>
                  <p className="text-xs text-gray-500">{METRICS.find(m => m.key === metric)?.label}</p>
                </div>
                {/* Mini progress bar */}
                <div className="w-16 hidden sm:block">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${entry.completionPct || 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-0.5">{entry.completionPct || 0}%</p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-10 text-center text-gray-400 text-sm">No data for this period</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
