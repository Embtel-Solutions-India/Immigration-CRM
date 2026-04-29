import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ChevronRight, User, Mail, Phone } from 'lucide-react';
import { getDocClients, createDocClient, deleteDocClient } from '../../api/docApi.js';
import { getUsers } from '../../api/userApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';

const SERVICE_TYPES = ['Bookkeeping', 'Tax Filing', 'Payroll', 'Financial Reports', 'Compliance', 'Auditing', 'Other'];

const STATUS_BADGE = {
  Active:    'bg-green-100 text-green-700',
  Inactive:  'bg-gray-100 text-gray-600',
  Completed: 'bg-blue-100 text-blue-700',
};

function ProgressBar({ pct }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

const BLANK = { name: '', email: '', mobile: '', address: '', serviceType: 'Bookkeeping', assignedTo: '', amountPaid: '', totalWorkValue: '', notes: '' };

export default function DocClients() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDocAdmin, isSuperAdmin } = useAuth();
  const canCreate = isDocAdmin || isSuperAdmin;

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (serviceFilter) params.serviceType = serviceFilter;
    getDocClients(params).then(setClients).finally(() => setLoading(false));
  };

  useEffect(() => {
    getUsers().then(u => setUsers(u.filter(x => x.team === 'Documentation')));
  }, []);

  useEffect(() => { load(); }, [search, statusFilter, serviceFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amountPaid: Number(form.amountPaid) || 0, totalWorkValue: Number(form.totalWorkValue) || 0 };
      if (!payload.assignedTo) delete payload.assignedTo;
      await createDocClient(payload);
      dispatch(showToast({ message: 'Client created' }));
      setShowModal(false);
      setForm(BLANK);
      load();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || 'Failed to create client', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client) => {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    try {
      await deleteDocClient(client._id);
      dispatch(showToast({ message: `${client.name} deleted` }));
      load();
    } catch {
      dispatch(showToast({ message: 'Failed to delete client', type: 'error' }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Clients</h1>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Client
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Active</option><option>Inactive</option><option>Completed</option>
        </select>
        <select className="input w-auto" value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
          <option value="">All Services</option>
          {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : clients.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <User size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No clients found</p>
          {canCreate && <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Add First Client</button>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Client', 'Service', 'Assigned To', 'Financials', 'Progress', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(c => {
                const pct = c.totalWorkValue > 0 ? Math.round((c.workCompletedValue / c.totalWorkValue) * 100) : 0;
                return (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/doc/clients/${c._id}`)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={11} />{c.email}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1"><Phone size={11} />{c.mobile}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">{c.serviceType}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.assignedTo?.name || <span className="text-gray-400">Unassigned</span>}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">Paid: <span className="font-medium text-gray-800">${(c.amountPaid || 0).toLocaleString()}</span></div>
                      <div className="text-xs text-gray-500">Total: <span className="font-medium text-gray-800">${(c.totalWorkValue || 0).toLocaleString()}</span></div>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar pct={pct} />
                        <span className="text-xs font-medium text-gray-700 w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Link to={`/doc/clients/${c._id}`} className="btn-secondary py-1 px-2 text-xs">View</Link>
                        {canCreate && (
                          <button onClick={() => handleDelete(c)} className="btn-danger py-1 px-2 text-xs">Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <Modal title="New Client" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Mobile *</label>
                <input className="input" required value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
              </div>
              <div>
                <label className="label">Service Type</label>
                <select className="input" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
                  {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Address *</label>
                <input className="input" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="label">Amount Paid ($)</label>
                <input className="input" type="number" min="0" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))} />
              </div>
              <div>
                <label className="label">Total Work Value ($)</label>
                <input className="input" type="number" min="0" value={form.totalWorkValue} onChange={e => setForm(f => ({ ...f, totalWorkValue: e.target.value }))} />
              </div>
              <div>
                <label className="label">Assigned To</label>
                <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create Client'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
