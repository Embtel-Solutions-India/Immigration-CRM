import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { getWorkUnits } from '../../api/workUnitApi.js';
import { getUserReport } from '../../api/reportApi.js';
import { getUserKpis } from '../../api/kpiApi.js';
import KpiCard from '../../components/common/KpiCard.jsx';
import KpiProgressRing from '../../components/common/KpiProgressRing.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import WorkTimer from '../../components/common/WorkTimer.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const METRIC_LABELS = {
  callsMade:'Calls Made', emailsSent:'Emails Sent', leadsAdded:'Leads Added',
  dailyRevenue:'Revenue', dealsWon:'Deals Won', campaignsLaunched:'Campaigns',
  leadsGenerated:'Leads Gen', openRate:'Open Rate',
  casesMoved:'Cases Moved', casesSubmitted:'Cases Submitted', casesDelivered:'Delivered',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function UserDashboard() {
  const { user } = useSelector(s => s.auth);
  const [units, setUnits] = useState([]);
  const [report, setReport] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    try {
      const [unitsData, rep, kpiData] = await Promise.all([
        getWorkUnits({ date: today }),
        getUserReport(user._id, { from: today, to: today }),
        getUserKpis(user._id, { period: 'weekly' }),
      ]);
      setUnits(unitsData.items || []);
      setReport(rep);
      setKpis(kpiData || []);
    } finally {
      setLoading(false);
    }
  }, [user._id, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUnitUpdate = (updated) => {
    setUnits(prev => prev.map(u => u._id === updated._id ? updated : u));
  };

  const completed = units.filter(u => u.status === 'Completed').length;
  const active = units.filter(u => u.status === 'In Progress').length;

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Good {getGreeting()}, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tasks Today" value={`${completed}/${units.length}`} sub="completed" />
        <KpiCard label="Active Now" value={active} color="blue" />
        <KpiCard label="Hours Tracked" value={`${report?.hoursTracked ?? 0}h`} color="green" />
        <KpiCard label="Score" value={`${report?.score ?? 0}%`} color={report?.score >= 70 ? 'green' : 'orange'} />
      </div>

      {/* Weekly KPI Targets */}
      {kpis.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Weekly KPI Targets</h2>
            <Link to="/kpi" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="flex flex-wrap gap-5">
            {kpis.map(t => (
              <KpiProgressRing
                key={t._id}
                label={METRIC_LABELS[t.metric] || t.metric}
                current={t.currentValue}
                target={t.targetValue}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's Work Units */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Today's Work Units</h2>
          <Link to="/work-units/new" className="btn-primary text-sm">+ Add</Link>
        </div>
        {units.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-base">No work units today</p>
            <Link to="/work-units/new" className="btn-primary mt-4 inline-block text-sm">Create your first one</Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {units.map(unit => (
              <li key={unit._id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/work-units/${unit._id}`} className="font-medium text-gray-900 hover:text-brand-600 truncate">
                      {unit.title}
                    </Link>
                    <StatusBadge value={unit.status} />
                    {unit.leadStage && <StatusBadge value={unit.leadStage} />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{unit.workType?.replace('_', ' ')}</p>
                </div>
                <WorkTimer unit={unit} onUpdate={handleUnitUpdate} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {report && Object.keys(report.byStatus || {}).length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Today's Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(report.byStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <StatusBadge value={status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
