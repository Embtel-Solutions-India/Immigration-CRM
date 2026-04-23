import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { createWorkUnit, updateWorkUnit, getWorkUnit } from '../../api/workUnitApi.js';
import { showToast } from '../../store/uiSlice.js';
import Spinner from '../../components/common/Spinner.jsx';

const KIND_MAP = { Sales: 'SalesUnit', Marketing: 'MarketingUnit', Production: 'ProductionUnit', HR: 'HRUnit' };

export default function WorkUnitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', workType: 'task', status: 'Pending',
    team: user?.team || 'Sales', tags: '',
    // Sales
    callsMade: '', emailsSent: '', leadsAdded: '', leadStage: '', dealValue: '', expectedCloseDate: '', contactName: '', contactPhone: '',
    // Marketing
    campaignType: '', campaignName: '', openRate: '', clickRate: '', leadsGenerated: '', conversionsToSales: '', campaignCost: '',
    // Production
    clientName: '', caseType: '', stage: 'Received', deadline: '',
    // HR
    employeeName: '', requestType: '', hrStage: 'Received',
  });

  useEffect(() => {
    if (isEdit) {
      getWorkUnit(id).then(unit => {
        setForm(f => ({
          ...f,
          ...unit,
          tags: (unit.tags || []).join(', '),
          hrStage: unit.team === 'HR' ? (unit.stage || 'Received') : f.hrStage,
        }));
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        kind: KIND_MAP[form.team],
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        callsMade: form.callsMade ? +form.callsMade : undefined,
        emailsSent: form.emailsSent ? +form.emailsSent : undefined,
        leadsAdded: form.leadsAdded ? +form.leadsAdded : undefined,
        dealValue: form.dealValue ? +form.dealValue : undefined,
        openRate: form.openRate ? +form.openRate : undefined,
        clickRate: form.clickRate ? +form.clickRate : undefined,
        leadsGenerated: form.leadsGenerated ? +form.leadsGenerated : undefined,
        conversionsToSales: form.conversionsToSales ? +form.conversionsToSales : undefined,
        campaignCost: form.campaignCost ? +form.campaignCost : undefined,
        stage: form.team === 'HR' ? form.hrStage : form.stage,
      };
      const result = isEdit ? await updateWorkUnit(id, payload) : await createWorkUnit(payload);
      dispatch(showToast({ message: isEdit ? 'Updated!' : 'Created!' }));
      navigate(`/work-units/${result._id}`);
    } catch (e) {
      dispatch(showToast({ message: e.response?.data?.error || 'Error saving', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Work Unit' : 'New Work Unit'}</h1>
      <form onSubmit={submit} className="space-y-5">

        {/* Base fields */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm">Basic Info</h2>
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Follow-up call with Maria" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Work Type</label>
              <select className="input" value={form.workType} onChange={e => set('workType', e.target.value)}>
                <option value="task">Task</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="case_update">Case Update</option>
                <option value="campaign">Campaign</option>
                <option value="lead_update">Lead Update</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Blocked</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was done or discussed?" />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="H1B, hot-lead, urgent" />
          </div>
        </div>

        {/* Sales fields */}
        {form.team === 'Sales' && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm">Sales Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Calls Made</label><input type="number" min="0" className="input" value={form.callsMade} onChange={e => set('callsMade', e.target.value)} /></div>
              <div><label className="label">Emails Sent</label><input type="number" min="0" className="input" value={form.emailsSent} onChange={e => set('emailsSent', e.target.value)} /></div>
              <div><label className="label">Leads Added</label><input type="number" min="0" className="input" value={form.leadsAdded} onChange={e => set('leadsAdded', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Lead Stage</label>
                <select className="input" value={form.leadStage} onChange={e => set('leadStage', e.target.value)}>
                  <option value="">— None —</option>
                  <option>Hot</option><option>Warm</option><option>Cold</option><option>Won</option><option>Lost</option>
                </select>
              </div>
              <div><label className="label">Deal Value ($)</label><input type="number" min="0" className="input" value={form.dealValue} onChange={e => set('dealValue', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Contact Name</label><input className="input" value={form.contactName} onChange={e => set('contactName', e.target.value)} /></div>
              <div><label className="label">Expected Close</label><input type="date" className="input" value={form.expectedCloseDate ? form.expectedCloseDate.slice(0,10) : ''} onChange={e => set('expectedCloseDate', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Marketing fields */}
        {form.team === 'Marketing' && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm">Marketing Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Campaign Type</label>
                <select className="input" value={form.campaignType} onChange={e => set('campaignType', e.target.value)}>
                  <option value="">— None —</option>
                  <option>Employer</option><option>Attorney</option><option>Individual</option><option>Bulk</option>
                </select>
              </div>
              <div><label className="label">Campaign Name</label><input className="input" value={form.campaignName} onChange={e => set('campaignName', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Emails Sent</label><input type="number" min="0" className="input" value={form.emailsSent} onChange={e => set('emailsSent', e.target.value)} /></div>
              <div><label className="label">Open Rate %</label><input type="number" min="0" max="100" className="input" value={form.openRate} onChange={e => set('openRate', e.target.value)} /></div>
              <div><label className="label">Click Rate %</label><input type="number" min="0" max="100" className="input" value={form.clickRate} onChange={e => set('clickRate', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Leads Generated</label><input type="number" min="0" className="input" value={form.leadsGenerated} onChange={e => set('leadsGenerated', e.target.value)} /></div>
              <div><label className="label">Conversions</label><input type="number" min="0" className="input" value={form.conversionsToSales} onChange={e => set('conversionsToSales', e.target.value)} /></div>
              <div><label className="label">Cost ($)</label><input type="number" min="0" className="input" value={form.campaignCost} onChange={e => set('campaignCost', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Production fields */}
        {form.team === 'Production' && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm">Production Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Client Name</label><input className="input" value={form.clientName} onChange={e => set('clientName', e.target.value)} /></div>
              <div><label className="label">Case Type</label><input className="input" value={form.caseType} onChange={e => set('caseType', e.target.value)} placeholder="H1B, Green Card…" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stage</label>
                <select className="input" value={form.stage} onChange={e => set('stage', e.target.value)}>
                  <option>Received</option><option>In Progress</option><option>Review</option><option>Submitted</option><option>Delivered</option>
                </select>
              </div>
              <div><label className="label">Deadline (SLA)</label><input type="date" className="input" value={form.deadline ? form.deadline.slice(0,10) : ''} onChange={e => set('deadline', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* HR fields */}
        {form.team === 'HR' && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm">HR Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Employee Name</label><input className="input" value={form.employeeName} onChange={e => set('employeeName', e.target.value)} /></div>
              <div><label className="label">Request Type</label><input className="input" value={form.requestType} onChange={e => set('requestType', e.target.value)} placeholder="Onboarding, leave compliance, payroll..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stage</label>
                <select className="input" value={form.hrStage} onChange={e => set('hrStage', e.target.value)}>
                  <option>Received</option><option>Screening</option><option>Interview</option><option>Documentation</option><option>Completed</option>
                </select>
              </div>
              <div><label className="label">Deadline (SLA)</label><input type="date" className="input" value={form.deadline ? form.deadline.slice(0,10) : ''} onChange={e => set('deadline', e.target.value)} /></div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Work Unit'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
