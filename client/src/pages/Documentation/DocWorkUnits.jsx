import React, { useState, useEffect } from 'react';
import { Plus, Search, ClipboardCheck } from 'lucide-react';
import { getDocWorkUnits, createDocWorkUnit, updateDocWorkUnit, deleteDocWorkUnit } from '../../api/docApi.js';
import { getDocClients } from '../../api/docApi.js';
import { getUsers } from '../../api/userApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { format } from 'date-fns';

const STATUSES = ['Pending', 'In Progress', 'Completed'];

const STATUS_BADGE = {
  Pending: 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-orange-100 text-orange-700',
  Completed: 'bg-green-100 text-green-700',
};

const BLANK = { title: '', description: '', clientId: '', caseId: '', assignedTo: '', status: 'Pending', value: '', dueDate: '', completionPct: '0' };

export default function DocWorkUnits() {
  const dispatch = useDispatch();
  const { user, isDocAdmin, isSuperAdmin } = useAuth();

  const [units, setUnits] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    getDocWorkUnits(params)
      .then(data => {
        const filtered = search ? data.filter(w => w.title.toLowerCase().includes(search.toLowerCase()) || w.clientId?.name.toLowerCase().includes(search.toLowerCase())) : data;
        setUnits(filtered);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      getDocClients(),
      getUsers().then(u => u.filter(x => x.team === 'Documentation')),
    ]).then(([cl, us]) => { setClients(cl); setUsers(us); });
  }, []);

  useEffect(() => { load(); }, [search, statusFilter]);

  const openCreate = () => { setEditingUnit(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (u) => {
    setEditingUnit(u);
    setForm({ title: u.title, description: u.description || '', clientId: u.clientId?._id || '', caseId: u.caseId?._id || '', assignedTo: u.assignedTo?._id || '', status: u.status, value: u.value || '', dueDate: u.dueDate ? format(new Date(u.dueDate), 'yyyy-MM-dd') : '', completionPct: u.completionPct || '0' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value) || 0, completionPct: Number(form.completionPct) || 0 };
      if (!payload.assignedTo) payload.assignedTo = user._id;
      if (!payload.caseId) delete payload.caseId;
      if (!payload.dueDate) delete payload.dueDate;
      if (editingUnit) {
        await updateDocWorkUnit(editingUnit._id, payload);
        dispatch(showToast({ message: 'Work unit updated' }));
      } else {
        await createDocWorkUnit(payload);
        dispatch(showToast({ message: 'Work unit created' }));
      }
      setShowModal(false);
      load();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || 'Failed to save', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete "${u.title}"?`)) return;
    try {
      await deleteDocWorkUnit(u._id);
      dispatch(showToast({ message: 'Deleted' }));
      load();
    } catch {
      dispatch(showToast({ message: 'Failed to delete', type: 'error' }));
    }
  };

  const quickStatus = async (u, status) => {
    try {
      await updateDocWorkUnit(u._id, { status, completionPct: status === 'Completed' ? 100 : u.completionPct });
      dispatch(showToast({ message: `Marked ${status}` }));
      load();
    } catch {
      dispatch(showToast({ message: 'Failed to update', type: 'error' }));
    }
  };

  const totalValue = units.reduce((s, w) => s + (w.value || 0), 0);
  const completedValue = units.filter(w => w.status === 'Completed').reduce((s, w) => s + (w.value || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Work Units</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Work Unit</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: units.length },
          { label: 'Completed', value: units.filter(w => w.status === 'Completed').length },
          { label: 'In Progress', value: units.filter(w => w.status === 'In Progress').length },
          { label: 'Value Done', value: `$${completedValue.toLocaleString()}`, sub: `of $${totalValue.toLocaleString()}` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by title or client…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : units.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <ClipboardCheck size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No work units found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Task', 'Client', 'Assigned To', 'Value', 'Due Date', 'Progress', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {units.map(w => (
                <tr key={w._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{w.title}</p>
                    {w.description && <p className="text-xs text-gray-400 truncate max-w-[160px]">{w.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{w.clientId?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{w.assignedTo?.name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">${(w.value || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{w.dueDate ? format(new Date(w.dueDate), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${w.completionPct || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{w.completionPct || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[w.status] || 'bg-gray-100 text-gray-600'}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(w)} className="btn-secondary py-1 px-2 text-xs">Edit</button>
                      {w.status !== 'Completed' && (
                        <button onClick={() => quickStatus(w, 'Completed')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Done</button>
                      )}
                      {(isDocAdmin || isSuperAdmin) && (
                        <button onClick={() => handleDelete(w)} className="btn-danger py-1 px-2 text-xs">Del</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editingUnit ? 'Edit Work Unit' : 'New Work Unit'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Title *</label>
                <input className="input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Client *</label>
                <select className="input" required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assigned To</label>
                <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Self</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Value ($)</label>
                <input className="input" type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Completion %</label>
                <input className="input" type="number" min="0" max="100" value={form.completionPct} onChange={e => setForm(f => ({ ...f, completionPct: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editingUnit ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
