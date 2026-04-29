import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X, FileText } from 'lucide-react';
import { createDocDocument } from '../../api/docApi.js';
import { getDocClients, getDocCases } from '../../api/docApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const DEFAULT_DOC_TYPES = [
  'Bank Statements', 'Tax Returns', 'Payroll Records', 'Financial Statements',
  'Invoices', 'Receipts', 'Balance Sheet', 'Income Statement', 'Audit Report',
  'Compliance Certificate', 'Business Registration', 'Identity Document', 'Other',
];

const BLANK = {
  clientId: '', caseId: '', name: '', docType: 'Other',
  isRequired: false, status: 'Submitted', notes: '', fileName: '', isCustom: false,
};

export default function DocUploadForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const fileRef = useRef(null);

  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...BLANK, clientId: searchParams.get('clientId') || '' });
  const [customDocName, setCustomDocName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDocTypes, setCustomDocTypes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    Promise.all([getDocClients(), getDocCases()])
      .then(([cl, cs]) => { setClients(cl); setCases(cs); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (form.clientId) {
      getDocCases({ clientId: form.clientId }).then(setCases);
    }
  }, [form.clientId]);

  const allDocTypes = [...DEFAULT_DOC_TYPES, ...customDocTypes];

  const addCustomDocType = () => {
    if (!customDocName.trim()) return;
    const newType = customDocName.trim();
    setCustomDocTypes(prev => [...prev, newType]);
    setForm(f => ({ ...f, name: newType, docType: newType, isCustom: true }));
    setCustomDocName('');
    setShowCustomInput(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setForm(f => ({ ...f, fileName: file.name }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setForm(f => ({ ...f, fileName: file.name }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId) { dispatch(showToast({ message: 'Please select a client', type: 'error' })); return; }
    if (!form.name) { dispatch(showToast({ message: 'Please enter document name', type: 'error' })); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.caseId) delete payload.caseId;
      await createDocDocument(payload);
      dispatch(showToast({ message: 'Document submitted successfully' }));
      navigate(form.clientId ? `/doc/clients/${form.clientId}` : '/doc/documents');
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || 'Failed to submit document', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const filteredCases = cases.filter(c => !form.clientId || c.clientId?._id === form.clientId || c.clientId === form.clientId);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-900">Submit Document</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client & Case */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Assignment</h2>
          <div>
            <label className="label">Client *</label>
            <select className="input" required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value, caseId: '' }))}>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name} — {c.serviceType}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Case (optional)</label>
            <select className="input" value={form.caseId} onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))}>
              <option value="">No specific case</option>
              {filteredCases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
        </div>

        {/* Document Details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Document Details</h2>

          <div>
            <label className="label">Document Type</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {allDocTypes.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, docType: t, name: f.name || t }))}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${form.docType === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium border border-dashed border-brand-400 text-brand-600 hover:bg-brand-50 flex items-center gap-1"
              >
                <Plus size={12} /> Add Custom Doc
              </button>
            </div>
            {showCustomInput && (
              <div className="flex gap-2 mt-2">
                <input
                  className="input flex-1"
                  placeholder="Custom document name…"
                  value={customDocName}
                  onChange={e => setCustomDocName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomDocType())}
                />
                <button type="button" onClick={addCustomDocType} className="btn-primary px-3">Add</button>
                <button type="button" onClick={() => setShowCustomInput(false)} className="btn-secondary px-3"><X size={14} /></button>
              </div>
            )}
          </div>

          <div>
            <label className="label">Document Name *</label>
            <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Q1 2024 Bank Statement" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['Pending', 'Submitted', 'Approved', 'Rejected', 'Missing'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRequired}
                  onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600"
                />
                <span className="text-gray-700">Mark as Required</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" />
          </div>
        </div>

        {/* File Upload Area */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">File Upload</h2>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${selectedFile ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" />
            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mx-auto">
                  <FileText size={20} className="text-brand-600" />
                </div>
                <p className="font-medium text-gray-900 text-sm">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setSelectedFile(null); setForm(f => ({ ...f, fileName: '' })); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                  <Upload size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Drop files here or <span className="text-brand-600 font-medium">browse</span></p>
                <p className="text-xs text-gray-400">PDF, JPG, PNG, DOCX — up to 10MB</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">Note: File storage integration can be connected to your preferred provider.</p>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <><Spinner size="sm" /> Submitting…</> : <><Upload size={16} /> Submit Document</>}
          </button>
        </div>
      </form>
    </div>
  );
}

