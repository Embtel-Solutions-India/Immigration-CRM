import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { getOrgReport } from '../../api/reportApi.js';
import { getTopPerformers as getCeoTopPerformers } from '../../api/orgApi.js';
import KpiCard from '../../components/common/KpiCard.jsx';
import PipelineBar from '../../components/charts/PipelineBar.jsx';
import StageDonut from '../../components/charts/StageDonut.jsx';
import TeamCompareBar from '../../components/charts/TeamCompareBar.jsx';
import MultiSeriesSalesChart from '../../components/charts/MultiSeriesSalesChart.jsx';
import MultiSeriesMarketingChart from '../../components/charts/MultiSeriesMarketingChart.jsx';
import ForecastCard from '../../components/charts/ForecastCard.jsx';
import HeatmapChart from '../../components/charts/HeatmapChart.jsx';
import Spinner from '../../components/common/Spinner.jsx';

export default function CeoDashboard() {
  const [report, setReport] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const to = format(new Date(), 'yyyy-MM-dd');
  const from = format(subDays(new Date(), range), 'yyyy-MM-dd');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOrgReport({ from, to }),
      getCeoTopPerformers().catch(() => []),
    ]).then(([rep, top]) => {
      setReport(rep);
      setTopPerformers(top || []);
    }).finally(() => setLoading(false));
  }, [from, to]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const { sales = {}, marketing = {}, production = {}, efficiency = {} } = report || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organization Overview</h1>
          <p className="text-sm text-gray-500">{format(new Date(from), 'MMM d')} — {format(new Date(to), 'MMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${range === d ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Revenue KPIs */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenue & Sales</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={`$${(sales.totalRevenue || 0).toLocaleString()}`} color="green" />
          <KpiCard label="Expected Revenue" value={`$${(sales.expectedRevenue || 0).toLocaleString()}`} color="blue" />
          <KpiCard label="Calls Made" value={sales.callsMade || 0} />
          <KpiCard label="Leads Added" value={sales.leadsAdded || 0} />
        </div>
      </div>

      {/* Revenue Forecast */}
      <ForecastCard />

      {/* Sales + Marketing charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Sales Performance</h2>
            <Link to="/leaderboard" className="text-xs text-brand-600 hover:underline">Leaderboard</Link>
          </div>
          <MultiSeriesSalesChart view="org" isSuperAdmin />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Marketing Performance</h2>
          <MultiSeriesMarketingChart view="org" isSuperAdmin />
        </div>
      </div>

      {/* Pipeline + Stage charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Sales Pipeline</h2>
          <PipelineBar data={sales.pipeline || {}} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Case Stages</h2>
          <StageDonut data={production.byStage || {}} />
        </div>
      </div>

      {/* Marketing KPIs */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Marketing</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Emails Sent" value={(marketing.emailsSent || 0).toLocaleString()} />
          <KpiCard label="Avg Open Rate" value={`${marketing.avgOpenRate || 0}%`} color="blue" />
          <KpiCard label="Leads Generated" value={marketing.leadsGenerated || 0} color="green" />
          <KpiCard label="Conversions" value={marketing.conversions || 0} color="purple" />
        </div>
      </div>

      {/* Production KPIs */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Production</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Cases" value={production.totalCases || 0} />
          <KpiCard label="In Progress" value={production.byStage?.['Application Drafted'] || 0} color="blue" />
          <KpiCard label="Approved" value={production.byStage?.Approved || 0} color="green" />
          <KpiCard label="Overdue" value={production.overdueCount || 0} color="red" />
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Performers by Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topPerformers.map((p, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{p.team}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {p.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">Score: {p.score}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Performance + Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Team Performance Scores</h2>
          <TeamCompareBar scores={efficiency.teamScores || {}} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Activity Heatmap</h2>
          <HeatmapChart />
        </div>
      </div>
    </div>
  );
}
