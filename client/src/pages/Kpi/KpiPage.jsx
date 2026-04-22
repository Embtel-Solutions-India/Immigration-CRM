import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Target, Plus, X } from 'lucide-react';
import { getUserKpis, getTeamKpis, setKpiTarget } from '../../api/kpiApi.js';
import { getUsers } from '../../api/userApi.js';
import KpiProgressRing from '../../components/common/KpiProgressRing.jsx';
import Modal from '../../components/common/Modal.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const TEAM_METRICS = {
  Sales:      ['callsMade','emailsSent','leadsAdded','dailyRevenue','dealsWon'],
  Marketing:  ['emailsSent','campaignsLaunched','leadsGenerated','openRate'],
  Production: ['casesMoved','casesSubmitted','casesDelivered'],
};

const METRIC_LABELS = {
  callsMade:'Calls Made', emailsSent:'Emails Sent', leadsAdded:'Leads Added',
  dailyRevenue:'Revenue Closed', dealsWon:'Deals Won', campaignsLaunched:'Campaigns Launched',
  leadsGenerated:'Leads Generated', openRate:'Open Rate %',
  casesMoved:'Cases Moved', casesSubmitted:'Cases Submitted', casesDelivered:'Cases Delivered',
};

export default function KpiPage() {
  const dispatch = useDispatch();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [targets, setTargets] = useState([]);
  const [teamTargets, setTeamTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ userId: '', metric: '', targetValue: '', period: 'weekly' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [mine, team] = await Promise.all([
        getUserKpis(user._id, { period }),
        (isAdmin || isSuperAdmin) ? getTeamKpis(user.team, { period }) : Promise.resolve([]),
      ]);
      setTargets(mine);
      setTeamTargets(team);
      if (isAdmin || isSuperAdmin) {
        const u = await getUsers();
        setUsers(u.filter(u => u.team === user.team));
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [period]);

  const handleSet = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setKpiTarget({ ...form, team: user.team });
      dispatch(showToast({ message: 'KPI target set' }));
      setShowModal(false);
      fetch();
    } finally { setSaving(false); }
  };

  const byUser = teamTargets.reduce((acc, t) => {
    const uid = t.userId?._id || t.userId;
    const name = t.userId?.name || 'Unknown';
    if (!acc[uid]) acc[uid] = { name, targets: [] };
    acc[uid].targets.push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">KPI Targets</h1>
        </div>
        <div className="flex gap-2">
          {['weekly','monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${period === p ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1">
              <Plus size={14} /> Set Target
            </button>
          )}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <>
          {/* My Targets */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">My {period === 'weekly' ? 'Weekly' : 'Monthly'} Targets</h2>
            {targets.length === 0 ? (
              <p className="text-sm text-gray-400">No targets set for this period.</p>
            ) : (
              <div className="flex flex-wrap gap-6">
                {targets.map(t => (
                  <KpiProgressRing
                    key={t._id}
                    label={METRIC_LABELS[t.metric] || t.metric}
                    current={t.currentValue}
                    target={t.targetValue}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Team Targets Grid */}
          {(isAdmin || isSuperAdmin) && Object.keys(byUser).length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Team KPI Progress</h2>
              <div className="space-y-6">
                {Object.entries(byUser).map(([uid, { name, targets: ut }]) => (
                  <div key={uid}>
                    <p className="text-sm font-medium text-gray-700 mb-3">{name}</p>
                    <div className="flex flex-wrap gap-5">
                      {ut.map(t => (
                        <KpiProgressRing
                          key={t._id}
                          label={METRIC_LABELS[t.metric] || t.metric}
                          current={t.currentValue}
                          target={t.targetValue}
                          size={72}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal title="Set KPI Target" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSet} className="space-y-4">
            <div>
              <label className="label">Team Member</label>
              <select className="input" required value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
                <option value="">Select member...</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Metric</label>
                <select className="input" required value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
                  <option value="">Select metric...</option>
                  {(TEAM_METRICS[user.team] || []).map(m => (
                    <option key={m} value={m}>{METRIC_LABELS[m] || m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Target Value</label>
                <input type="number" min="1" className="input" required value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Period</label>
              <select className="input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Setting...' : 'Set Target'}</button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
