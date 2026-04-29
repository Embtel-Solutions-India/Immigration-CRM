import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, User, DollarSign,
  FolderOpen, FileText, ClipboardCheck, Edit2, Save, X, Plus,
} from 'lucide-react';
import {
  getDocClient, updateDocClient,
  getDocCases, createDocCase, getDocDocuments, getDocWorkUnits, getDocChecklist,
} from '../../api/docApi.js';
import Modal from '../../components/common/Modal.jsx';
import { getUsers } from '../../api/userApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SERVICE_TYPES = ['Bookkeeping', 'Tax Filing', 'Payroll', 'Financial Reports', 'Compliance', 'Auditing', 'Other'];
const STATUS_OPTS = ['Active', 'Inactive', 'Completed'];
const PIE_COLORS = ['#2563eb', '#e5e7eb'];

const CASE_STATUSES = ['Open', 'In Progress', 'Under Review', 'Completed', 'Closed'];
const WORKFLOW_STAGES = ['Checklist Sent', 'Documents Received', 'Missing Documents', 'Under Review', 'Work In Progress', 'Completed'];

const STAGE_COLORS = {
  'Checklist Sent':      'bg-blue-50 border-blue-200',
  'Documents Received':  'bg-teal-50 border-teal-200',
  'Missing Documents':   'bg-red-50 border-red-200',
  'Under Review':        'bg-purple-50 border-purple-200',
  'Work In Progress':    'bg-orange-50 border-orange-200',
  Completed:             'bg-green-50 border-green-200',
};

const BLANK_CASE = { title: '', serviceType: 'Bookkeeping', status: 'Open', workflowStage: 'Checklist Sent', assignedTo: '', deadline: '', notes: '' };

const STATUS_BADGE = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-orange-100 text-orange-700',
  'Under Review': 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
};

const DOC_STATUS_BADGE = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Missing: 'bg-red-100 text-red-700',
};

export default function DocClientDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isDocAdmin, isSuperAdmin } = useAuth();
  const canEdit = isDocAdmin || isSuperAdmin;

  const [client, setClient] = useState(null);
  const [cases, setCases] = useState([]);
  const [docs, setDocs] = useState([]);
  const [workUnits, setWorkUnits] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('overview');
  const [caseStatusFilter, setCaseStatusFilter] = useState('');
  const [showAddCase, setShowAddCase] = useState(false);
  const [addCaseForm, setAddCaseForm] = useState(BLANK_CASE);
  const [savingCase, setSavingCase] = useState(false);

  const load = async () => {
    try {
      const [c, cs, ds, wu, cl, us] = await Promise.all([
        getDocClient(id),
        getDocCases({ clientId: id }),
        getDocDocuments({ clientId: id }),
        getDocWorkUnits({ clientId: id }),
        getDocChecklist(id),
        getUsers(),
      ]);
      setClient(c);
      setEditForm({ name: c.name, email: c.email, mobile: c.mobile, address: c.address, serviceType: c.serviceType, status: c.status, amountPaid: c.amountPaid, totalWorkValue: c.totalWorkValue, assignedTo: c.assignedTo?._id || '', notes: c.notes || '' });
      setCases(cs);
      setDocs(ds);
      setWorkUnits(wu);
      setChecklist(cl);
      setUsers(us.filter(x => x.team === 'Documentation'));
    } catch {
      dispatch(showToast({ message: 'Failed to load client', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...editForm, amountPaid: Number(editForm.amountPaid) || 0, totalWorkValue: Number(editForm.totalWorkValue) || 0 };
      if (!payload.assignedTo) delete payload.assignedTo;
      const updated = await updateDocClient(id, payload);
      setClient(updated);
      setEditing(false);
      dispatch(showToast({ message: 'Client updated' }));
    } catch {
      dispatch(showToast({ message: 'Failed to update', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCase = async (e) => {
    e.preventDefault();
    setSavingCase(true);
    try {
      const payload = { ...addCaseForm, clientId: id };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.deadline) delete payload.deadline;
      await createDocCase(payload);
      dispatch(showToast({ message: 'Case created' }));
      setShowAddCase(false);
      setAddCaseForm(BLANK_CASE);
      load();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || 'Failed to create case', type: 'error' }));
    } finally {
      setSavingCase(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!client) return <div className="card p-8 text-center text-gray-400">Client not found</div>;

  const pct = client.totalWorkValue > 0 ? Math.round((client.workCompletedValue / client.totalWorkValue) * 100) : 0;
  const pieData = [
    { name: 'Completed', value: client.workCompletedValue || 0 },
    { name: 'Remaining', value: Math.max((client.totalWorkValue || 0) - (client.workCompletedValue || 0), 0) },
  ];
  const completedDocs = docs.filter(d => d.status === 'Submitted' || d.status === 'Approved').length;
  const completedUnits = workUnits.filter(w => w.status === 'Completed').length;
  const checklistDone = checklist?.items?.filter(i => i.completed).length || 0;
  const checklistTotal = checklist?.items?.length || 0;

  const TABS = ['overview', 'cases', 'documents', 'work-units', 'checklist'];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/doc/clients" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500">{client.serviceType}</p>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1.5"><Edit2 size={14} /> Edit</button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5"><Save size={14} />{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} className="btn-secondary"><X size={14} /></button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-gray-100 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Personal Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Personal Info</h2>
            {editing ? (
              <div className="space-y-3">
                {[['name', 'Name'], ['email', 'Email'], ['mobile', 'Mobile'], ['address', 'Address']].map(([k, l]) => (
                  <div key={k}>
                    <label className="label">{l}</label>
                    <input className="input" value={editForm[k] || ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="label">Service Type</label>
                  <select className="input" value={editForm.serviceType} onChange={e => setEditForm(f => ({ ...f, serviceType: e.target.value }))}>
                    {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assigned To</label>
                  <select className="input" value={editForm.assignedTo} onChange={e => setEditForm(f => ({ ...f, assignedTo: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><User size={15} className="text-gray-400" /><span>{client.name}</span></div>
                <div className="flex items-center gap-2 text-sm"><Mail size={15} className="text-gray-400" /><span>{client.email}</span></div>
                <div className="flex items-center gap-2 text-sm"><Phone size={15} className="text-gray-400" /><span>{client.mobile}</span></div>
                <div className="flex items-start gap-2 text-sm"><MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" /><span>{client.address}</span></div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="bg-brand-50 text-brand-700 text-xs font-medium px-2 py-1 rounded-full">{client.serviceType}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Assigned to: <span className="font-medium text-gray-700">{client.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Financial Progress */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Financial Progress</h2>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Amount Paid ($)</label>
                  <input className="input" type="number" min="0" value={editForm.amountPaid} onChange={e => setEditForm(f => ({ ...f, amountPaid: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Total Work Value ($)</label>
                  <input className="input" type="number" min="0" value={editForm.totalWorkValue} onChange={e => setEditForm(f => ({ ...f, totalWorkValue: e.target.value }))} />
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Amount Paid</span><span className="font-semibold text-green-600">${(client.amountPaid || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Work Completed</span><span className="font-semibold text-brand-600">${(client.workCompletedValue || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Remaining</span><span className="font-semibold text-orange-600">${Math.max((client.totalWorkValue || 0) - (client.workCompletedValue || 0), 0).toLocaleString()}</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-center text-xs text-gray-500">{pct}% complete</p>
                </div>
              </>
            )}
          </div>

          {/* Summary Cards */}
          <div className="space-y-3">
            {[
              { label: 'Cases', value: cases.length, sub: `${cases.filter(c => c.status === 'Completed').length} completed`, Icon: FolderOpen, color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: 'Documents', value: docs.length, sub: `${completedDocs} submitted`, Icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Work Units', value: workUnits.length, sub: `${completedUnits} completed`, Icon: ClipboardCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
              { label: 'Checklist', value: `${checklistDone}/${checklistTotal}`, sub: checklist?.stage || 'Not started', Icon: ClipboardCheck, color: 'text-green-500', bg: 'bg-green-50' },
            ].map(({ label, value, sub, Icon, color, bg }) => (
              <div key={label} className="card p-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}><Icon size={16} className={color} /></div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cases' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">Cases ({cases.length})</h2>
            <div className="flex items-center gap-2">
              <Link to="/doc/cases" className="text-xs text-brand-600 hover:underline">View All</Link>
              {canEdit && (
                <button onClick={() => setShowAddCase(true)} className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3">
                  <Plus size={13} /> Add Case
                </button>
              )}
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCaseStatusFilter('')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${caseStatusFilter === '' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              All <span className="ml-1 font-bold">{cases.length}</span>
            </button>
            {CASE_STATUSES.map(s => {
              const count = cases.filter(c => c.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setCaseStatusFilter(caseStatusFilter === s ? '' : s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${caseStatusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  {s} <span className="ml-1 font-bold">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Kanban columns by workflow stage */}
          {(() => {
            const filtered = caseStatusFilter ? cases.filter(c => c.status === caseStatusFilter) : cases;
            if (filtered.length === 0) {
              return <div className="card p-8 text-center text-gray-400 text-sm">No cases found</div>;
            }
            return (
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: '200px' }}>
                {WORKFLOW_STAGES.map(stage => {
                  const stageCases = filtered.filter(c => c.workflowStage === stage);
                  return (
                    <div key={stage} className={`rounded-xl border ${STAGE_COLORS[stage] || 'bg-gray-50 border-gray-200'} flex-shrink-0 w-52`}>
                      <div className="px-3 py-2.5 border-b border-inherit flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700 leading-tight">{stage}</span>
                        <span className="text-xs bg-white text-gray-600 rounded-full px-2 py-0.5 font-medium flex-shrink-0">{stageCases.length}</span>
                      </div>
                      <div className="p-2 space-y-2">
                        {stageCases.map(c => (
                          <div key={c._id} className="bg-white rounded-lg p-3 shadow-sm border border-transparent">
                            <p className="text-xs font-semibold text-gray-900 leading-snug">{c.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{c.serviceType}</p>
                            <div className="mt-2 flex items-center justify-between gap-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                              <span className="text-xs text-gray-400">{c.progress}%</span>
                            </div>
                            {c.progress !== undefined && (
                              <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.progress}%` }} />
                              </div>
                            )}
                          </div>
                        ))}
                        {stageCases.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">Empty</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Add Case Modal */}
      {showAddCase && (
        <Modal title="New Case" onClose={() => setShowAddCase(false)}>
          <form onSubmit={handleAddCase} className="space-y-4">
            <div>
              <label className="label">Case Title *</label>
              <input className="input" required value={addCaseForm.title} onChange={e => setAddCaseForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Service Type</label>
                <select className="input" value={addCaseForm.serviceType} onChange={e => setAddCaseForm(f => ({ ...f, serviceType: e.target.value }))}>
                  {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={addCaseForm.status} onChange={e => setAddCaseForm(f => ({ ...f, status: e.target.value }))}>
                  {CASE_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Workflow Stage</label>
                <select className="input" value={addCaseForm.workflowStage} onChange={e => setAddCaseForm(f => ({ ...f, workflowStage: e.target.value }))}>
                  {WORKFLOW_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input className="input" type="date" value={addCaseForm.deadline} onChange={e => setAddCaseForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={addCaseForm.notes} onChange={e => setAddCaseForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowAddCase(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={savingCase} className="btn-primary">{savingCase ? 'Saving…' : 'Create Case'}</button>
            </div>
          </form>
        </Modal>
      )}

      {tab === 'documents' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Documents ({docs.length})</h2>
            <Link to={`/doc/documents/new?clientId=${id}`} className="btn-primary text-xs py-1.5 px-3">Upload Doc</Link>
          </div>
          {docs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No documents yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {docs.map(d => (
                <div key={d._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.docType} · {d.isRequired ? 'Required' : 'Optional'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOC_STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'work-units' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Work Units ({workUnits.length})</h2>
          </div>
          {workUnits.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No work units yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {workUnits.map(w => (
                <div key={w._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{w.title}</p>
                    <p className="text-xs text-gray-500">Assigned to: {w.assignedTo?.name || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-green-600">${(w.value || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.status === 'Completed' ? 'bg-green-100 text-green-700' : w.status === 'In Progress' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{w.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'checklist' && checklist && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Checklist — {checklist.stage}</h2>
            <Link to={`/doc/checklist/${id}`} className="btn-secondary text-xs py-1.5 px-3">Manage Checklist</Link>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${checklistTotal > 0 ? Math.round(checklistDone / checklistTotal * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-gray-500 mb-4">{checklistDone} of {checklistTotal} items completed</p>
          <div className="space-y-2">
            {checklist.items.slice(0, 6).map(item => (
              <div key={item._id} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${item.completed ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`}>
                  {item.completed && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>{item.label}</span>
                {item.required && <span className="text-xs text-red-500 ml-auto">Required</span>}
              </div>
            ))}
            {checklist.items.length > 6 && <p className="text-xs text-gray-400">+{checklist.items.length - 6} more</p>}
          </div>
        </div>
      )}
    </div>
  );
}
