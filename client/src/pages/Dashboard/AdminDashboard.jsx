import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';
import { getTeamReport } from '../../api/reportApi.js';
import { getTeamKpis } from '../../api/kpiApi.js';
import KpiCard from '../../components/common/KpiCard.jsx';
import KpiProgressRing from '../../components/common/KpiProgressRing.jsx';
import MultiSeriesSalesChart from '../../components/charts/MultiSeriesSalesChart.jsx';
import MultiSeriesMarketingChart from '../../components/charts/MultiSeriesMarketingChart.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const METRIC_LABELS = {
  callsMade:'Calls Made', emailsSent:'Emails Sent', leadsAdded:'Leads Added',
  dailyRevenue:'Revenue', dealsWon:'Deals Won', campaignsLaunched:'Campaigns',
  leadsGenerated:'Leads Gen', openRate:'Open Rate',
  casesMoved:'Cases Moved', casesSubmitted:'Cases Submitted', casesDelivered:'Delivered',
};

function ScorePill({ score }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700'
    : score >= 60 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{score}%</span>;
}

export default function AdminDashboard() {
  const { user } = useSelector(s => s.auth);
  const [report, setReport] = useState(null);
  const [teamKpis, setTeamKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    Promise.all([
      getTeamReport(user.team, { from: today, to: today }),
      getTeamKpis(user.team, { period: 'weekly' }),
    ]).then(([rep, kpis]) => {
      setReport(rep);
      setTeamKpis(kpis || []);
    }).finally(() => setLoading(false));
  }, [user.team, today]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const totalCompleted = report?.memberStats?.reduce((s, m) => s + m.completed, 0) || 0;
  const totalUnits = report?.totalUnits || 0;
  const avgScore = report?.memberStats?.length
    ? Math.round(report.memberStats.reduce((s, m) => s + m.score, 0) / report.memberStats.length)
    : 0;

  const lowActivity = report?.memberStats?.filter(m => m.total === 0 || m.score < 40) || [];

  const kpiByUser = teamKpis.reduce((acc, t) => {
    const uid = t.userId?._id || t.userId;
    const name = t.userId?.name || 'Unknown';
    if (!acc[uid]) acc[uid] = { name, kpis: [] };
    acc[uid].kpis.push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{user.team} Team — Today</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Team Members" value={report?.memberStats?.length || 0} />
        <KpiCard label="Units Today" value={totalUnits} color="blue" />
        <KpiCard label="Completed" value={totalCompleted} color="green" />
        <KpiCard label="Avg Score" value={`${avgScore}%`} color={avgScore >= 70 ? 'green' : 'orange'} />
      </div>

      {lowActivity.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Low Activity Alert</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {lowActivity.map(m => m.name).join(', ')} — no or very low activity today.
            </p>
          </div>
        </div>
      )}

      {/* Sales / Marketing chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Monthly Performance</h2>
          <Link to="/reports" className="text-xs text-brand-600 hover:underline">Full report</Link>
        </div>
        {user.team === 'Marketing' ? (
          <MultiSeriesMarketingChart view="team" entityId={user.team} isAdmin />
        ) : (
          <MultiSeriesSalesChart view="team" entityId={user.team} isAdmin />
        )}
      </div>

      {/* Team Member Cards */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Team Member Performance</h2>
          <Link to="/team" className="text-xs text-brand-600 hover:underline">Team view</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {(report?.memberStats || []).map(member => (
            <div key={member.userId} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {member.name[0]}
                  </div>
                  <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                </div>
                <ScorePill score={member.score} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <div className="text-lg font-bold text-gray-900">{member.total}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{member.completed}</div>
                  <div className="text-xs text-gray-500">Done</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{member.hoursTracked}h</div>
                  <div className="text-xs text-gray-500">Tracked</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
                  style={{ width: `${member.total ? Math.round(member.completed / member.total * 100) : 0}%` }}
                />
              </div>
              {/* KPI rings for this member */}
              {kpiByUser[member.userId]?.kpis?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">KPI Targets</p>
                  <div className="flex flex-wrap gap-3">
                    {kpiByUser[member.userId].kpis.slice(0, 3).map(t => (
                      <KpiProgressRing
                        key={t._id}
                        label={METRIC_LABELS[t.metric] || t.metric}
                        current={t.currentValue}
                        target={t.targetValue}
                        size={56}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
