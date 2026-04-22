import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { useSelector } from 'react-redux';
import { getUserReport, getTeamReport, getOrgReport, getActivity } from '../../api/reportApi.js';
import KpiCard from '../../components/common/KpiCard.jsx';
import WeeklyLineChart from '../../components/charts/WeeklyLineChart.jsx';
import PipelineBar from '../../components/charts/PipelineBar.jsx';
import StageDonut from '../../components/charts/StageDonut.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function Reports() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [from, setFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const reportFetch = isSuperAdmin
      ? getOrgReport({ from, to })
      : isAdmin
        ? getTeamReport(user.team, { from, to })
        : getUserReport(user._id, { from, to });

    Promise.all([reportFetch, getActivity({ limit: 20 })])
      .then(([rep, act]) => { setData(rep); setActivity(act); })
      .finally(() => setLoading(false));
  }, [from, to]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [['Metric', 'Value']];
    if (isSuperAdmin) {
      rows.push(['Total Revenue', data.sales?.totalRevenue || 0]);
      rows.push(['Expected Revenue', data.sales?.expectedRevenue || 0]);
      rows.push(['Calls Made', data.sales?.callsMade || 0]);
      rows.push(['Emails Sent', data.marketing?.emailsSent || 0]);
      rows.push(['Total Cases', data.production?.totalCases || 0]);
    } else {
      rows.push(['Total Units', data.total || 0]);
      rows.push(['Hours Tracked', data.hoursTracked || 0]);
      rows.push(['Score', `${data.score || 0}%`]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {isSuperAdmin ? 'Organization Report' : isAdmin ? `${user.team} Team Report` : 'My Report'}
        </h1>
        <div className="flex gap-2 items-center">
          <input type="date" className="input w-36" value={from} onChange={e => setFrom(e.target.value)} />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" className="input w-36" value={to} onChange={e => setTo(e.target.value)} />
          <button onClick={exportCSV} className="btn-secondary">⬇ CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* User/Team Report */}
          {!isSuperAdmin && data && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Units" value={data.total} />
              <KpiCard label="Completed" value={data.byStatus?.Completed || 0} color="green" />
              <KpiCard label="Hours Tracked" value={`${data.hoursTracked}h`} color="blue" />
              <KpiCard label="Score" value={`${data.score}%`} color={data.score >= 70 ? 'green' : 'orange'} />
            </div>
          )}

          {/* Org Report */}
          {isSuperAdmin && data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Revenue" value={`$${(data.sales?.totalRevenue||0).toLocaleString()}`} color="green" />
                <KpiCard label="Expected" value={`$${(data.sales?.expectedRevenue||0).toLocaleString()}`} color="blue" />
                <KpiCard label="Cases" value={data.production?.totalCases || 0} />
                <KpiCard label="Overdue" value={data.production?.overdueCount || 0} color="red" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 mb-3">Sales Pipeline</h2>
                  <PipelineBar data={data.sales?.pipeline || {}} />
                </div>
                <div className="card p-5">
                  <h2 className="font-semibold text-gray-900 mb-3">Case Stages</h2>
                  <StageDonut data={data.production?.byStage || {}} />
                </div>
              </div>
            </>
          )}

          {/* Activity Log */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity.</p>
            ) : (
              <ul className="space-y-2">
                {activity.map((log) => (
                  <li key={log._id} className="flex items-start gap-3 text-sm">
                    <span className="w-2 h-2 bg-brand-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-700">{log.userId?.name}</span>
                      <span className="text-gray-500"> {log.action.replace(/_/g, ' ')}</span>
                      {log.meta?.title && <span className="text-gray-400"> — {log.meta.title}</span>}
                      <div className="text-xs text-gray-400">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
