import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getWorkUnit, addComment, updateWorkUnit } from '../../api/workUnitApi.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import WorkTimer from '../../components/common/WorkTimer.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Blocked'];

export default function WorkUnitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAdmin, user } = useAuth();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getWorkUnit(id).then(setUnit).finally(() => setLoading(false));
  }, [id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await addComment(id, comment);
      const updated = await getWorkUnit(id);
      setUnit(updated);
      setComment('');
      dispatch(showToast({ message: 'Comment added' }));
    } finally {
      setPosting(false);
    }
  };

  const changeStatus = async (status) => {
    const updated = await updateWorkUnit(id, { status });
    setUnit(u => ({ ...u, status: updated.status }));
    dispatch(showToast({ message: `Status → ${status}` }));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!unit) return <div className="text-center text-gray-400 py-20">Work unit not found</div>;

  const canEdit = isAdmin || unit.userId?._id === user._id || unit.userId === user._id;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{unit.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge value={unit.status} />
            <span className="text-xs text-gray-400 capitalize">{unit.workType?.replace('_', ' ')} · {unit.team}</span>
            {unit.leadStage && <StatusBadge value={unit.leadStage} />}
          </div>
        </div>
        {canEdit && (
          <Link to={`/work-units/${id}/edit`} className="btn-secondary">Edit</Link>
        )}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <WorkTimer unit={unit} onUpdate={setUnit} />
          <div className="flex gap-1">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${unit.status === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {unit.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{unit.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          {unit.startTime && (
            <div>
              <p className="text-xs text-gray-500">Start</p>
              <p>{format(new Date(unit.startTime), 'MMM d, h:mm a')}</p>
            </div>
          )}
          {unit.endTime && (
            <div>
              <p className="text-xs text-gray-500">End</p>
              <p>{format(new Date(unit.endTime), 'MMM d, h:mm a')}</p>
            </div>
          )}
          {unit.dealValue && (
            <div>
              <p className="text-xs text-gray-500">Deal Value</p>
              <p className="font-semibold text-green-700">${unit.dealValue.toLocaleString()}</p>
            </div>
          )}
          {unit.expectedCloseDate && (
            <div>
              <p className="text-xs text-gray-500">Expected Close</p>
              <p>{format(new Date(unit.expectedCloseDate), 'MMM d, yyyy')}</p>
            </div>
          )}
          {unit.deadline && (
            <div>
              <p className="text-xs text-gray-500">Deadline (SLA)</p>
              <p className={new Date(unit.deadline) < new Date() ? 'text-red-600 font-medium' : ''}>
                {format(new Date(unit.deadline), 'MMM d, yyyy')}
              </p>
            </div>
          )}
          {unit.clientName && (
            <div>
              <p className="text-xs text-gray-500">Client</p>
              <p>{unit.clientName}</p>
            </div>
          )}
        </div>

        {unit.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unit.tags.map(t => (
              <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Status Updates for Production */}
      {unit.statusUpdates?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Status Timeline</h2>
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {unit.statusUpdates.map((su, i) => (
              <li key={i} className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-brand-500 rounded-full -left-1.5 border-2 border-white" />
                <StatusBadge value={su.stage} />
                {su.note && <p className="text-sm text-gray-600 mt-1">{su.note}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{su.updatedAt ? format(new Date(su.updatedAt), 'MMM d, h:mm a') : ''}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Comments */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Comments</h2>
        {unit.comments?.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">No comments yet.</p>
        )}
        <div className="space-y-3 mb-4">
          {(unit.comments || []).map((c) => (
            <div key={c._id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-700">{c.authorId?.name || 'User'}</span>
                <span className="text-xs text-gray-400">{c.createdAt ? format(new Date(c.createdAt), 'MMM d, h:mm a') : ''}</span>
              </div>
              <p className="text-sm text-gray-700">{c.text}</p>
            </div>
          ))}
        </div>
        <form onSubmit={submitComment} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Add a comment…"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <button type="submit" disabled={posting || !comment.trim()} className="btn-primary">Post</button>
        </form>
      </div>
    </div>
  );
}
