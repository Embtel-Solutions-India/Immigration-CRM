import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FolderOpen, FileText, CheckCircle, TrendingUp, DollarSign,
  ClipboardCheck, AlertCircle,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { getDocDashboardStats, getDocMonthlyTrend, getDocClientProgress } from '../../api/docApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { format } from 'date-fns';

function StatCard({ label, value, sub, Icon, color = 'brand', href }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  const card = (
    <div className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link to={href}>{card}</Link> : card;
}

function ProgressBar({ pct, color = 'bg-brand-500' }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

const PIE_COLORS = ['#2563eb', '#e5e7eb'];

export default function DocDashboard() {
  const { user, isDocAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [clientProgress, setClientProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocDashboardStats(),
      getDocMonthlyTrend(),
      getDocClientProgress(),
    ]).then(([s, t, cp]) => {
      setStats(s);
      setTrend(t);
      setClientProgress(cp);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const pieData = stats ? [
    { name: 'Completed', value: stats.completedWorkValue },
    { name: 'Remaining', value: Math.max(stats.remainingWorkValue, 0) },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Documentation Dashboard</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={stats?.totalClients ?? 0} Icon={Users} color="brand" href="/doc/clients" />
        <StatCard label="Active Cases" value={stats?.activeCases ?? 0} Icon={FolderOpen} color="orange" href="/doc/cases" />
        <StatCard label="Completed Cases" value={stats?.completedCases ?? 0} Icon={CheckCircle} color="green" href="/doc/cases" />
        <StatCard label="Work Completion" value={`${stats?.completionPct ?? 0}%`} Icon={TrendingUp} color="purple" />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={stats?.totalDocuments ?? 0} Icon={FileText} color="brand" href="/doc/documents" />
        <StatCard label="Submitted Docs" value={stats?.submittedDocuments ?? 0} sub="Submitted or approved" Icon={CheckCircle} color="green" />
        <StatCard label="Pending Docs" value={stats?.pendingDocuments ?? 0} Icon={AlertCircle} color="orange" />
        <StatCard label="Work Units" value={stats?.completedWorkValue != null ? `$${stats.completedWorkValue.toLocaleString()}` : '$0'} sub="completed value" Icon={DollarSign} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Work Completed vs Remaining Pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Work Value Overview</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-brand-600 inline-block" /> Completed
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> Remaining
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-brand-600">${(stats?.completedWorkValue || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-400">${(Math.max(stats?.remainingWorkValue, 0) || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
          </div>
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Work Value Completed</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="workValue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Work Value ($)" />
              <Line type="monotone" dataKey="completedUnits" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Completed Units" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Financial Progress</h2>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">${(stats?.totalAmountPaid || 0).toLocaleString()}</span> collected of{' '}
            <span className="font-medium text-gray-900">${(stats?.totalClientWorkValue || 0).toLocaleString()}</span>
          </div>
        </div>
        <ProgressBar
          pct={stats?.totalClientWorkValue > 0 ? (stats.totalAmountPaid / stats.totalClientWorkValue) * 100 : 0}
          color="bg-green-500"
        />
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <p className="text-lg font-bold text-green-600">${(stats?.totalAmountPaid || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Amount Collected</p>
          </div>
          <div>
            <p className="text-lg font-bold text-brand-600">${(stats?.completedWorkValue || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Work Completed Value</p>
          </div>
          <div>
            <p className="text-lg font-bold text-orange-600">${(Math.max(stats?.remainingWorkValue, 0) || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Remaining Work Value</p>
          </div>
        </div>
      </div>

      {/* Client Progress Bar Chart */}
      {clientProgress.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Client-wise Progress</h2>
            <Link to="/doc/clients" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clientProgress} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="pct" fill="#2563eb" radius={[0, 4, 4, 0]} name="Progress %" maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/doc/clients', label: 'Manage Clients', Icon: Users, color: 'bg-brand-600' },
          { to: '/doc/cases', label: 'View Cases', Icon: FolderOpen, color: 'bg-orange-500' },
          { to: '/doc/documents/new', label: 'Upload Document', Icon: FileText, color: 'bg-green-600' },
          { to: '/doc/work-units', label: 'Work Units', Icon: ClipboardCheck, color: 'bg-purple-600' },
        ].map(({ to, label, Icon, color }) => (
          <Link key={to} to={to} className={`${color} text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}>
            <Icon size={22} />
            <span className="text-sm font-medium text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
