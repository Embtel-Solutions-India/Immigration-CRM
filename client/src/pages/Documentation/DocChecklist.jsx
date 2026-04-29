import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, CheckCircle2, Circle } from 'lucide-react';
import {
  getDocChecklist, updateChecklistStage,
  toggleChecklistItem, addCustomChecklistItem, removeChecklistItem,
  getDocClient,
} from '../../api/docApi.js';
import Spinner from '../../components/common/Spinner.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';

const WORKFLOW_STAGES = [
  'Checklist Sent', 'Documents Received', 'Missing Documents',
  'Under Review', 'Work In Progress', 'Completed',
];

const STAGE_COLORS = {
  'Checklist Sent':      { dot: 'bg-blue-500',   ring: 'ring-blue-200' },
  'Documents Received':  { dot: 'bg-teal-500',   ring: 'ring-teal-200' },
  'Missing Documents':   { dot: 'bg-red-500',    ring: 'ring-red-200' },
  'Under Review':        { dot: 'bg-purple-500', ring: 'ring-purple-200' },
  'Work In Progress':    { dot: 'bg-orange-500', ring: 'ring-orange-200' },
  Completed:             { dot: 'bg-green-500',  ring: 'ring-green-200' },
};

export default function DocChecklist() {
  const { clientId } = useParams();
  const dispatch = useDispatch();
  const { isDocAdmin, isSuperAdmin } = useAuth();
  const canManage = isDocAdmin || isSuperAdmin;

  const [client, setClient] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [newRequired, setNewRequired] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    try {
      const [cl, ch] = await Promise.all([getDocClient(clientId), getDocChecklist(clientId)]);
      setClient(cl);
      setChecklist(ch);
    } catch {
      dispatch(showToast({ message: 'Failed to load checklist', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const handleToggle = async (itemId) => {
    if (!checklist) return;
    setToggling(itemId);
    try {
      const updated = await toggleChecklistItem(checklist._id, itemId);
      setChecklist(updated);
    } catch {
      dispatch(showToast({ message: 'Failed to update item', type: 'error' }));
    } finally {
      setToggling(null);
    }
  };

  const handleStageChange = async (stage) => {
    if (!checklist) return;
    try {
      const updated = await updateChecklistStage(checklist._id, stage);
      setChecklist(updated);
      dispatch(showToast({ message: `Stage updated to "${stage}"` }));
    } catch {
      dispatch(showToast({ message: 'Failed to update stage', type: 'error' }));
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      const updated = await addCustomChecklistItem(checklist._id, { label: newItem.trim(), required: newRequired });
      setChecklist(updated);
      setNewItem('');
      setNewRequired(false);
      setShowAdd(false);
      dispatch(showToast({ message: 'Custom item added' }));
    } catch {
      dispatch(showToast({ message: 'Failed to add item', type: 'error' }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remove this custom item?')) return;
    try {
      const updated = await removeChecklistItem(checklist._id, itemId);
      setChecklist(updated);
      dispatch(showToast({ message: 'Item removed' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || 'Failed to remove item', type: 'error' }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!checklist) return <div className="card p-8 text-center text-gray-400">Checklist not found</div>;

  const completed = checklist.items.filter(i => i.completed).length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const currentStageIdx = WORKFLOW_STAGES.indexOf(checklist.stage);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to={`/doc/clients/${clientId}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Checklist</h1>
          {client && <p className="text-sm text-gray-500">{client.name} — {client.serviceType}</p>}
        </div>
      </div>

      {/* Workflow Stage Stepper */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Workflow Stage</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const colors = STAGE_COLORS[stage];
            const isCurrent = stage === checklist.stage;
            const isDone = idx < currentStageIdx;
            return (
              <React.Fragment key={stage}>
                <button
                  onClick={() => canManage && handleStageChange(stage)}
                  disabled={!canManage}
                  className={`flex flex-col items-center gap-1.5 min-w-[80px] px-2 transition-opacity ${canManage ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 transition-all ${isCurrent ? `${colors.dot} ring-offset-2 ${colors.ring}` : isDone ? 'bg-green-500 ring-green-200 ring-offset-2' : 'bg-gray-200 ring-transparent'}`}>
                    {isDone ? <span className="text-white text-xs">✓</span> : <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-gray-400'}`} />}
                  </div>
                  <span className={`text-xs text-center leading-tight ${isCurrent ? 'font-semibold text-gray-900' : isDone ? 'text-green-600' : 'text-gray-400'}`}>{stage}</span>
                  {isCurrent && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">Current</span>}
                </button>
                {idx < WORKFLOW_STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[20px] mt-[-18px] ${idx < currentStageIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Checklist Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">Checklist Progress</h2>
            <p className="text-sm text-gray-500">{completed} of {total} items completed</p>
          </div>
          <div className="text-2xl font-bold text-brand-600">{pct}%</div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="space-y-2">
          {checklist.items.map(item => (
            <div
              key={item._id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <button
                onClick={() => handleToggle(item._id)}
                disabled={toggling === item._id}
                className="flex-shrink-0 text-gray-400 hover:text-brand-600 transition-colors"
              >
                {toggling === item._id ? (
                  <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                ) : item.completed ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.label}</span>
                {item.isCustom && <span className="ml-2 text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Custom</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.required && (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Required</span>
                )}
                {item.isCustom && canManage && (
                  <button onClick={() => handleRemoveItem(item._id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add custom item */}
        {canManage && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {showAdd ? (
              <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input flex-1"
                  placeholder="Custom checklist item…"
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  autoFocus
                />
                <label className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                  <input type="checkbox" checked={newRequired} onChange={e => setNewRequired(e.target.checked)} className="w-4 h-4" />
                  Required
                </label>
                <button type="submit" className="btn-primary px-4">Add</button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary px-3"><X size={14} /></button>
              </form>
            ) : (
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                <Plus size={16} /> Add Custom Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Missing items highlight */}
      {checklist.items.filter(i => !i.completed && i.required).length > 0 && (
        <div className="card p-4 border-l-4 border-red-400 bg-red-50">
          <p className="text-sm font-semibold text-red-700 mb-2">Missing Required Items</p>
          <ul className="space-y-1">
            {checklist.items.filter(i => !i.completed && i.required).map(i => (
              <li key={i._id} className="text-sm text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {i.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
