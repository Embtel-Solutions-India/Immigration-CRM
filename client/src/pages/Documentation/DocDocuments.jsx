import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText } from 'lucide-react';
import { getDocDocuments, deleteDocDocument, updateDocDocument } from '../../api/docApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { format } from 'date-fns';

const STATUSES = ['Pending', 'Submitted', 'Approved', 'Rejected', 'Missing'];

const STATUS_BADGE = {
  Pending:   'bg-yellow-100 text-yellow-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
  Missing:   'bg-red-50 text-red-600',
};

export default function DocDocuments() {
  const dispatch = useDispatch();
  const { isDocAdmin, isSuperAdmin } = useAuth();
  const canDelete = isDocAdmin || isSuperAdmin;

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customFilter, setCustomFilter] = useState('');

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (customFilter !== '') params.isCustom = customFilter;
    getDocDocuments(params)
      .then(data => {
        const filtered = search ? data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.clientId?.name?.toLowerCase().includes(search.toLowerCase())) : data;
        setDocs(filtered);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter, customFilter]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    try {
      await deleteDocDocument(doc._id);
      dispatch(showToast({ message: 'Document deleted' }));
      load();
    } catch {
      dispatch(showToast({ message: 'Failed to delete', type: 'error' }));
    }
  };

  const handleStatusChange = async (doc, status) => {
    try {
      await updateDocDocument(doc._id, { status });
      dispatch(showToast({ message: `Status updated to ${status}` }));
      load();
    } catch {
      dispatch(showToast({ message: 'Failed to update', type: 'error' }));
    }
  };

  const statCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: docs.filter(d => d.status === s).length }), {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Documents</h1>
        <Link to="/doc/documents/new" className="btn-primary flex items-center gap-2"><Plus size={16} /> Submit Document</Link>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600'}`}
          >
            {s} <span className="ml-1 font-bold">{statCounts[s] || 0}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name or client…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={customFilter} onChange={e => setCustomFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="false">Standard</option>
          <option value="true">Custom</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <FileText size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No documents found</p>
          <Link to="/doc/documents/new" className="btn-primary mt-4 inline-block">Submit Document</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Document', 'Client', 'Type', 'Uploaded By', 'Date', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docs.map(d => (
                <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 flex items-center gap-1.5">
                      <FileText size={14} className="text-gray-400" />
                      {d.name}
                      {d.isCustom && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded ml-1">Custom</span>}
                    </div>
                    {d.isRequired && <span className="text-xs text-red-500">Required</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.clientId?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.docType}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.uploadedBy?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.uploadDate ? format(new Date(d.uploadDate), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={e => handleStatusChange(d, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {canDelete && (
                      <button onClick={() => handleDelete(d)} className="btn-danger py-1 px-2 text-xs">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
