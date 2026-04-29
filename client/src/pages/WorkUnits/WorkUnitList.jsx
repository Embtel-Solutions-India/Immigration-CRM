import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getWorkUnits, deleteWorkUnit } from '../../api/workUnitApi.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

export default function WorkUnitList() {
  const { isAdmin, isOverallAdmin } = useAuth();
  const dispatch = useDispatch();
  const [units, setUnits] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [filters, setFilters] = useState({ from: '', to: '', status: '', team: '' });
  const teamUserBuckets = units.reduce((acc, unit) => {
    const team = unit.team || 'Unknown';
    const userName = unit.userId?.name || 'Unknown';
    if (!acc[team]) acc[team] = {};
    if (!acc[team][userName]) acc[team][userName] = 0;
    acc[team][userName] += 1;
    return acc;
  }, {});
  const orderedTeams = Object.keys(teamUserBuckets).sort();

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.status) params.status = filters.status;
    if (filters.team) params.team = filters.team;
    try {
      const data = await getWorkUnits(params);
      setUnits(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work unit?')) return;
    await deleteWorkUnit(id);
    dispatch(showToast({ message: 'Deleted', type: 'success' }));
    fetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Work Units <span className="text-gray-400 font-normal text-base">({total})</span></h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setView('table')} className={view === 'table' ? 'btn-primary' : 'btn-secondary'}>Table</button>
          <button onClick={() => setView('card')} className={view === 'card' ? 'btn-primary' : 'btn-secondary'}>Cards</button>
          <Link to="/work-units/new" className="btn-primary">+ New</Link>
        </div>
      </div>

      <div className="card p-4">
        <FilterBar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
      </div>

      {isOverallAdmin && orderedTeams.length > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Team Wise Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {orderedTeams.map((team) => (
              <div key={team} className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{team}</p>
                <div className="space-y-1.5">
                  {Object.entries(teamUserBuckets[team])
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <p key={`${team}-${name}`} className="text-xs text-gray-700 flex justify-between">
                        <span>{name}</span>
                        <span className="font-medium">{count}</span>
                      </p>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : units.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          No work units found. <Link to="/work-units/new" className="text-brand-600 hover:underline">Create one.</Link>
        </div>
      ) : view === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Team</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {units.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/work-units/${u._id}`} className="font-medium text-gray-900 hover:text-brand-600">
                        {u.title}
                      </Link>
                      {u.userId?.name && <div className="text-xs text-gray-400">{u.userId.name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize hidden sm:table-cell">{u.workType?.replace('_', ' ')}</td>
                    <td className="px-4 py-3"><StatusBadge value={u.status} /></td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.team}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.date ? format(new Date(u.date), 'MMM d') : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/work-units/${u._id}/edit`} className="text-xs text-brand-600 hover:underline">Edit</Link>
                        {isAdmin && (
                          <button onClick={() => handleDelete(u._id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map(u => (
            <Link key={u._id} to={`/work-units/${u._id}`} className="card p-4 hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm leading-snug">{u.title}</h3>
                <StatusBadge value={u.status} />
              </div>
              <p className="text-xs text-gray-500 capitalize mb-3">{u.workType?.replace('_', ' ')} · {u.team}</p>
              {u.description && <p className="text-xs text-gray-600 line-clamp-2">{u.description}</p>}
              <div className="mt-3 text-xs text-gray-400">{u.date ? format(new Date(u.date), 'MMM d, yyyy') : ''}</div>
            </Link>
          ))}
        </div>
      )}

      {total > 25 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary">← Prev</button>
          <span className="text-sm text-gray-500 self-center">Page {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={units.length < 25} className="btn-secondary">Next →</button>
        </div>
      )}
    </div>
  );
}
