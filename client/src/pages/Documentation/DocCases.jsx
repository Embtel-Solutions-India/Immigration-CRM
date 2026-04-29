import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderOpen, Calendar } from 'lucide-react';
import { getDocCases, createDocCase, deleteDocCase } from '../../api/docApi.js';
import { getDocClients } from '../../api/docApi.js';
import { getUsers } from '../../api/userApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { format } from 'date-fns';

const SERVICE_TYPES = ['Bookkeeping', 'Tax Filing', 'Payroll', 'Financial Reports', 'Compliance', 'Auditing', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Under Review', 'Completed', 'Closed'];
const WORKFLOW_STAGES = ['Checklist Sent', 'Documents Received', 'Missing Documents', 'Under Review', 'Work In Progress', 'Completed'];

const STATUS_BADGE = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-orange-100 text-orange-700',
  'Under Review': 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
};

const STAGE_BADGE = {
  'Checklist Sent': 'bg-blue-50 text-blue-600',
  'Documents Received': 'bg-teal-50 text-teal-600',
  'Missing Documents': 'bg-red-50 text-red-600',
  'Under Review': 'bg-purple-50 text-purple-600',
  'Work In Progress': 'bg-orange-50 text-orange-600',
  Completed: 'bg-green-50 text-green-600',
};

const BLANK = { clientId: '', title: '', serviceType: 'Bookkeeping', status: 'Open', workflowStage: 'Checklist Sent', assignedTo: '', deadline: '', payment: { totalAmount: '', amountPaid: '' }, notes: '' };

export default function DocCases() {
  const dispatch = useDispatch();
  const { isDocAdmin, isSuperAdmin } = useAuth();
  const canCreate = isDocAdmin || isSuperAdmin;

  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    getDocCases(params).then(setCases).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      getDocClients(),
      getUsers().then(u => u.filter(x => x.team === 'Documentation')),
    ]).then(([cl, us]) => { setClients(cl); setUsers(us); });
  }, []);

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        payment: {
          totalAmount: Number(form.payment.totalAmount) || 0,
          amountPaid: Number(form.payment.amountPaid) || 0,
        },
      };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.deadline) delete payload.deadline;
      await createDocCase(payload);
      dispatch(showToast({ message: 'Case created' }));
      setShowModal(false);
      setForm(BLANK);
      load();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || 'Failed to create case', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    try {
      await deleteDocCase(c._id);
      dispatch(showToast({ message: 'Case deleted' }));
      load();
    } catch {
      dispatch(showToast({ message: 'Failed to delete case', type: 'error' }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Cases</h1>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : cases.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <FolderOpen size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No cases found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {cases.map(c => (
            <div key={c._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.clientId?.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">{c.serviceType}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_BADGE[c.workflowStage] || 'bg-gray-50 text-gray-600'}`}>{c.workflowStage}</span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span><span>{c.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.progress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                {c.assignedTo && <div>Assigned: <span className="font-medium text-gray-700">{c.assignedTo.name}</span></div>}
                {c.deadline && (
                  <div className="flex items-center gap-1"><Calendar size={11} />{format(new Date(c.deadline), 'MMM d, yyyy')}</div>
                )}
                {c.payment?.totalAmount > 0 && (
                  <div>Value: <span className="font-medium text-gray-700">${c.payment.totalAmount.toLocaleString()}</span></div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <Link to={`/doc/clients/${c.clientId?._id}`} className="btn-secondary py-1 px-2 text-xs flex-1 text-center">View Client</Link>
                {canCreate && (
                  <button onClick={() => handleDelete(c)} className="btn-danger py-1 px-2 text-xs">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <Modal title="New Case" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Client *</label>
                <select className="input" required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Case Title *</label>
                <input className="input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Service Type</label>
                <select className="input" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
                  {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Workflow Stage</label>
                <select className="input" value={form.workflowStage} onChange={e => setForm(f => ({ ...f, workflowStage: e.target.value }))}>
                  {WORKFLOW_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assigned To</label>
                <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input className="input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="label">Total Amount ($)</label>
                <input className="input" type="number" min="0" value={form.payment.totalAmount} onChange={e => setForm(f => ({ ...f, payment: { ...f.payment, totalAmount: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Amount Paid ($)</label>
                <input className="input" type="number" min="0" value={form.payment.amountPaid} onChange={e => setForm(f => ({ ...f, payment: { ...f.payment, amountPaid: e.target.value } }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create Case'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
