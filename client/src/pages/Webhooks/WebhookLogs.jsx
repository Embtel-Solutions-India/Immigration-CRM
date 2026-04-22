import React, { useEffect, useState } from 'react';
import { Webhook, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth.js';
import { showToast } from '../../store/uiSlice.js';
import Spinner from '../../components/common/Spinner.jsx';
import api from '../../api/axios.js';

const STATUS_CONFIG = {
  success:  { icon: CheckCircle,  cls: 'text-green-600',  bg: 'bg-green-100' },
  failed:   { icon: XCircle,      cls: 'text-red-600',    bg: 'bg-red-100'   },
  retrying: { icon: RefreshCw,    cls: 'text-yellow-600', bg: 'bg-yellow-100'},
  pending:  { icon: Clock,        cls: 'text-gray-500',   bg: 'bg-gray-100'  },
};

function formatTs(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.cls}`}>
      <Icon size={11} />
      {status}
    </span>
  );
}

export default function WebhookLogs() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const dispatch = useDispatch();
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...(filter ? { status: filter } : {}) };
      const [logsRes, statusRes] = await Promise.all([
        api.get('/webhooks/logs', { params }).then(r => r.data),
        api.get('/webhooks/integrations/status').then(r => r.data),
      ]);
      setLogs(logsRes.logs || []);
      setTotal(logsRes.total || 0);
      setStatus(statusRes);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin || isSuperAdmin) load(); }, [page, filter]);

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      await api.post(`/webhooks/retry/${id}`);
      dispatch(showToast({ message: 'Retry queued' }));
      load();
    } catch {
      dispatch(showToast({ message: 'Retry failed', type: 'error' }));
    } finally { setRetrying(null); }
  };

  if (!isAdmin && !isSuperAdmin) {
    return <div className="text-center py-24 text-gray-400">Admin access required</div>;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Webhook size={20} className="text-brand-600" />
        <h1 className="text-xl font-bold text-gray-900">Webhook Logs</h1>
      </div>

      {/* Integration Status */}
      {status && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Received', value: status.total || 0 },
            { label: 'Success', value: status.success || 0, color: 'text-green-600' },
            { label: 'Failed', value: status.failed || 0, color: 'text-red-600' },
            { label: 'Avg Latency', value: status.avgLatency ? `${status.avgLatency}ms` : '—' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color || 'text-gray-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'success', 'failed', 'retrying', 'pending'].map(s => (
          <button
            key={s || 'all'}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s || 'All'}
          </button>
        ))}
        <button onClick={load} className="ml-auto btn-secondary text-xs flex items-center gap-1">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Timestamp','Platform','Event Type','Status','Retries','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No webhook events found</td></tr>
                ) : logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTs(log.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.platform}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{log.eventType}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {log.retryCount > 0 ? (
                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">{log.retryCount}x</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(log._id)}
                          disabled={retrying === log._id}
                          className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                        >
                          <RefreshCw size={11} className={retrying === log._id ? 'animate-spin' : ''} />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Prev</button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
