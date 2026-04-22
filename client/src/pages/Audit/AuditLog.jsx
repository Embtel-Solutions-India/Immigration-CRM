import React, { useEffect, useState } from "react";
import { ShieldCheck, Download, ChevronDown } from "lucide-react";
import { useDispatch } from "react-redux";
import { useAuth } from "../../hooks/useAuth.js";
import { showToast } from "../../store/uiSlice.js";
import Spinner from "../../components/common/Spinner.jsx";
import api from "../../api/axios.js";

const ACTIONS = [
  "",
  "kpi_target_set",
  "leave_requested",
  "leave_approved",
  "leave_rejected",
  "org_settings_updated",
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "EXPORT",
  "REVIEW",
];
const ENTITIES = [
  "",
  "User",
  "WorkUnit",
  "Case",
  "KpiTarget",
  "LeaveRequest",
  "OrgSettings",
  "WebhookLog",
];

function formatTs(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLog() {
  const { isSuperAdmin } = useAuth();
  const dispatch = useDispatch();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    entity: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await api.get("/audit", { params }).then((r) => r.data);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [page, filters, isSuperAdmin]);

  const handleExport = async () => {
    try {
      const res = await api.get("/audit/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_log_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch(showToast({ message: "Export downloaded" }));
    } catch {
      dispatch(showToast({ message: "Export failed", type: "error" }));
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <ShieldCheck size={40} className="mb-3 opacity-40" />
        <p className="font-medium">Superadmin access required</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          {total > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {total.toLocaleString()} records
            </span>
          )}
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center gap-1 text-sm"
        >
          <Download size={14} /> Export XLSX
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-[180px] text-sm"
          placeholder="Search user or action..."
          value={filters.search}
          onChange={(e) => {
            setFilters((f) => ({ ...f, search: e.target.value }));
            setPage(1);
          }}
        />
        <div className="relative">
          <select
            className="input pr-8 text-sm"
            value={filters.action}
            onChange={(e) => {
              setFilters((f) => ({ ...f, action: e.target.value }));
              setPage(1);
            }}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a || "All Actions"}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
        <div className="relative">
          <select
            className="input pr-8 text-sm"
            value={filters.entity}
            onChange={(e) => {
              setFilters((f) => ({ ...f, entity: e.target.value }));
              setPage(1);
            }}
          >
            {ENTITIES.map((e) => (
              <option key={e} value={e}>
                {e || "All Entities"}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    "Timestamp",
                    "User",
                    "Role",
                    "Action",
                    "Entity",
                    "Details",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatTs(log.timestamp || log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {log.performedBy?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.role === "superadmin"
                              ? "bg-purple-100 text-purple-700"
                              : log.role === "admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {log.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.action === "DELETE"
                              ? "bg-red-100 text-red-700"
                              : log.action === "CREATE"
                                ? "bg-green-100 text-green-700"
                                : log.action === "UPDATE"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.entity}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">
                        {log.entityId ? (
                          <span className="font-mono">{log.entityId}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
