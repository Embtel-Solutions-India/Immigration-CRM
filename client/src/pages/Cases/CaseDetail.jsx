import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { getCase, addStatusUpdate } from "../../api/caseApi.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useDispatch } from "react-redux";
import { showToast } from "../../store/uiSlice.js";

const STAGES = [
  "Document Collection",
  "Application Drafted",
  "Internal Team Review",
  "Client Review",
  "Petition Filed",
  "Under Government Review",
  "Approved",
];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAdmin } = useAuth();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState({ stage: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCase(id)
      .then(setC)
      .finally(() => setLoading(false));
  }, [id]);

  const submitUpdate = async (e) => {
    e.preventDefault();
    if (!update.stage) return;
    setSaving(true);
    try {
      const updated = await addStatusUpdate(id, update);
      setC(updated);
      setUpdate({ stage: "", note: "" });
      dispatch(showToast({ message: `Stage updated to ${update.stage}` }));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  if (!c)
    return (
      <div className="text-center py-20 text-gray-400">Case not found</div>
    );

  const isOverdue =
    c.deadline && new Date(c.deadline) < new Date() && c.stage !== "Delivered";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/cases")}
          className="text-gray-400 hover:text-gray-600"
        >
          ←
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{c.clientName}</h1>
            <StatusBadge value={c.stage} />
            {isOverdue && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                Overdue
              </span>
            )}
          </div>
          {c.caseNumber && (
            <p className="text-sm text-gray-400">
              {c.caseNumber} · {c.caseType}
            </p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Client Email</p>
            <p>{c.clientEmail || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p>{c.clientPhone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Assigned To</p>
            <p>{c.assignedTo?.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Deadline</p>
            <p className={isOverdue ? "text-red-600 font-semibold" : ""}>
              {c.deadline ? format(new Date(c.deadline), "MMM d, yyyy") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Priority</p>
            <p>{c.priority}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p>{format(new Date(c.createdAt), "MMM d, yyyy")}</p>
          </div>
        </div>
        {c.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{c.notes}</p>
          </div>
        )}
      </div>

      {/* Stage Progress */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Stage Progress</h2>
        <div className="flex items-center gap-1">
          {STAGES.map((stage, i) => {
            const stageIdx = STAGES.indexOf(c.stage);
            const done = i <= stageIdx;
            return (
              <React.Fragment key={stage}>
                <div className={`flex-1 text-center`}>
                  <div
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"}`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">
                    {stage}
                  </p>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className={`h-0.5 w-8 flex-shrink-0 ${i < stageIdx ? "bg-brand-600" : "bg-gray-100"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Update Status */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Update Status</h2>
        <form onSubmit={submitUpdate} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New Stage</label>
              <select
                className="input"
                required
                value={update.stage}
                onChange={(e) =>
                  setUpdate((f) => ({ ...f, stage: e.target.value }))
                }
              >
                <option value="">Select stage…</option>
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Note</label>
              <input
                className="input"
                value={update.note}
                onChange={(e) =>
                  setUpdate((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="What was done?"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !update.stage}
            className="btn-primary"
          >
            {saving ? "Updating…" : "Update Stage"}
          </button>
        </form>
      </div>

      {/* Timeline */}
      {c.statusUpdates?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {[...c.statusUpdates].reverse().map((su, i) => (
              <li key={i} className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-brand-500 rounded-full -left-1.5 border-2 border-white" />
                <StatusBadge value={su.stage} />
                {su.note && (
                  <p className="text-sm text-gray-600 mt-1">{su.note}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {su.updatedBy?.name && `${su.updatedBy.name} · `}
                  {su.updatedAt
                    ? format(new Date(su.updatedAt), "MMM d, h:mm a")
                    : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
