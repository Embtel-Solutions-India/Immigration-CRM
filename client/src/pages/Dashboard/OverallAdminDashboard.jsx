import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { getOverallReport } from '../../api/reportApi.js';
import { getTopPerformers, getOrgHeatmap } from '../../api/orgApi.js';
import { getWorkUnits } from '../../api/workUnitApi.js';
import KpiCard from '../../components/common/KpiCard.jsx';
import PipelineBar from '../../components/charts/PipelineBar.jsx';
import StageDonut from '../../components/charts/StageDonut.jsx';
import TeamCompareBar from '../../components/charts/TeamCompareBar.jsx';
import MultiSeriesSalesChart from '../../components/charts/MultiSeriesSalesChart.jsx';
import MultiSeriesMarketingChart from '../../components/charts/MultiSeriesMarketingChart.jsx';
import ForecastCard from '../../components/charts/ForecastCard.jsx';
import HeatmapChart from '../../components/charts/HeatmapChart.jsx';
import Spinner from '../../components/common/Spinner.jsx';

export default function OverallAdminDashboard() {
  const [report, setReport] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [activeTeamTab, setActiveTeamTab] = useState('Sales');
  const [teamSummaries, setTeamSummaries] = useState({});

  const to = format(new Date(), 'yyyy-MM-dd');
  const from = format(subDays(new Date(), range), 'yyyy-MM-dd');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOverallReport({ from, to }),
      getTopPerformers().catch(() => []),
      getWorkUnits({ from, to, team: 'Sales', page: 1, limit: 1000 }).catch(() => ({ items: [] })),
      getWorkUnits({ from, to, team: 'Marketing', page: 1, limit: 1000 }).catch(() => ({ items: [] })),
      getWorkUnits({ from, to, team: 'Production', page: 1, limit: 1000 }).catch(() => ({ items: [] })),
    ]).then(([rep, top, salesRes, marketingRes, productionRes]) => {
      const normalizedTopPerformers = Array.isArray(top)
        ? top
        : Array.isArray(top?.topPerformers)
          ? top.topPerformers
          : Array.isArray(top?.data)
            ? top.data
            : [];
      const aggregate = (items = []) => ({
        totalTasks: items.length,
        completed: items.filter((u) => u.status === 'Completed').length,
        inProgress: items.filter((u) => u.status === 'In Progress').length,
        revenue: items.reduce((s, u) => s + (u.dealValue || 0), 0),
        callsMade: items.reduce((s, u) => s + (u.callsMade || 0), 0),
        emailsSent: items.reduce((s, u) => s + (u.emailsSent || 0), 0),
        leadsGenerated: items.reduce((s, u) => s + (u.leadsGenerated || 0), 0),
        conversions: items.reduce((s, u) => s + (u.conversionsToSales || 0), 0),
      });
      setReport(rep);
      setTopPerformers(normalizedTopPerformers);
      setTeamSummaries({
        Sales: aggregate(salesRes?.items || []),
        Marketing: aggregate(marketingRes?.items || []),
        Production: aggregate(productionRes?.items || []),
      });
    }).finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    getOrgHeatmap()
      .then((res) => {
        const normalizedHeatmap = Array.isArray(res)
          ? res
          : Array.isArray(res?.grid)
            ? res.grid
            : [];
        setHeatmapData(normalizedHeatmap);
      })
      .catch(() => setHeatmapData([]));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const { sales = {}, marketing = {}, production = {}, efficiency = {} } = report || {};

  const nonHrTopPerformers = (Array.isArray(topPerformers) ? topPerformers : []).filter((p) => p?.team !== 'HR');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="font-semibold text-gray-900">Sales Performance</h2>
            <Link to="/leaderboard" className="text-xs text-brand-600 hover:underline">Leaderboard</Link>
          </div>
          <MultiSeriesSalesChart view="org" isSuperAdmin />
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-900 mb-3 sm:mb-4">Marketing Performance</h2>
          <MultiSeriesMarketingChart view="org" isSuperAdmin />
        </div>
      </div>

      {/* Pipeline + Stage charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-900 mb-3 sm:mb-4">Sales Pipeline</h2>
          <PipelineBar data={sales.pipeline || {}} />
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-900 mb-3 sm:mb-4">Case Stages</h2>
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
      {nonHrTopPerformers.length > 0 && (
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-900 mb-3 sm:mb-4">Top Performers by Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {nonHrTopPerformers.map((p, i) => (
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-900 mb-3 sm:mb-4">Team Performance Scores</h2>
          <TeamCompareBar scores={efficiency.teamScores || {}} />
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-900 mb-3 sm:mb-4">Activity Heatmap</h2>
          <HeatmapChart data={heatmapData} />
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Team Performance Summary</h2>
          <Link to="/leaderboard" className="text-xs text-brand-600 hover:underline">Open Leaderboards</Link>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Sales', 'Marketing', 'Production'].map((team) => (
            <button
              key={team}
              onClick={() => setActiveTeamTab(team)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${activeTeamTab === team ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {team}
            </button>
          ))}
        </div>

        {activeTeamTab === 'Sales' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Tasks Performed" value={teamSummaries.Sales?.totalTasks || 0} />
            <KpiCard label="Calls Made" value={teamSummaries.Sales?.callsMade || 0} color="blue" />
            <KpiCard label="Emails Sent" value={teamSummaries.Sales?.emailsSent || 0} color="purple" />
            <KpiCard label="Revenue" value={`$${(teamSummaries.Sales?.revenue || 0).toLocaleString()}`} color="green" />
          </div>
        )}

        {activeTeamTab === 'Marketing' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Tasks Performed" value={teamSummaries.Marketing?.totalTasks || 0} />
            <KpiCard label="Emails Sent" value={teamSummaries.Marketing?.emailsSent || 0} color="blue" />
            <KpiCard label="Leads Generated" value={teamSummaries.Marketing?.leadsGenerated || 0} color="green" />
            <KpiCard label="Conversions" value={teamSummaries.Marketing?.conversions || 0} color="purple" />
          </div>
        )}

        {activeTeamTab === 'Production' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Tasks Performed" value={teamSummaries.Production?.totalTasks || 0} />
            <KpiCard label="Completed" value={teamSummaries.Production?.completed || 0} color="green" />
            <KpiCard label="In Progress" value={teamSummaries.Production?.inProgress || 0} color="blue" />
            <KpiCard label="Completion Rate" value={`${teamSummaries.Production?.totalTasks ? Math.round(((teamSummaries.Production?.completed || 0) / teamSummaries.Production.totalTasks) * 100) : 0}%`} color="purple" />
          </div>
        )}
      </div>
    </div>
  );
}
