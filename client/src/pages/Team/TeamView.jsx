import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { getUsers } from '../../api/userApi.js';
import { getTeamReport } from '../../api/reportApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import KpiCard from '../../components/common/KpiCard.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { isHrAdminRole, normalizeRole } from '../../utils/roles.js';

export default function TeamView() {
  const { user, isSuperAdmin } = useAuth();
  const role = normalizeRole(user?.role);
  const isHrAdmin = isHrAdminRole(role);
  const [selectedTeam, setSelectedTeam] = useState(user.team);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const from = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const to = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    setLoading(true);
    getTeamReport(selectedTeam, { from, to }).then(setReport).finally(() => setLoading(false));
  }, [selectedTeam, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Team View — Last 7 Days</h1>
        {(isSuperAdmin || isHrAdmin) && (
          <div className="flex gap-1">
            {['Sales', 'Marketing', 'Production', 'HR'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTeam(t)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${selectedTeam === t ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard label="Members" value={report?.memberStats?.length || 0} />
            <KpiCard label="Total Units" value={report?.totalUnits || 0} color="blue" />
            <KpiCard
              label="Avg Score"
              value={`${report?.memberStats?.length
                ? Math.round(report.memberStats.reduce((s, m) => s + m.score, 0) / report.memberStats.length)
                : 0}%`}
              color="green"
            />
          </div>

          <div className="card">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{selectedTeam} Team Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Units</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Completed</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Hours</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(report?.memberStats || []).map(m => {
                    const pct = m.total ? Math.round(m.completed / m.total * 100) : 0;
                    return (
                      <tr key={m.userId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {m.name[0]}
                            </div>
                            <span className="font-medium text-gray-900">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{m.total}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{m.completed}</td>
                        <td className="px-4 py-3 text-gray-700">{m.hoursTracked}h</td>
                        <td className="px-4 py-3">
                          <ScorePill score={m.score} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                              <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!report?.memberStats?.length && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No data for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScorePill({ score }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700'
    : score >= 60 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{score}%</span>;
}
