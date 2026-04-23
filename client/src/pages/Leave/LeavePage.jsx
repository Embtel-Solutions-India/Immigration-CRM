import React, { useEffect, useState } from "react";
import { Calendar, Plus, Check, X, Clock } from "lucide-react";
import { useDispatch } from "react-redux";
import {
  submitLeave,
  reviewLeave,
  getPendingLeaves,
  getTeamCalendar,
  getTeamLeaves,
  getUserLeaves,
  getAllLeaves,
} from "../../api/leaveApi.js";
import { showToast } from "../../store/uiSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import Modal from "../../components/common/Modal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { isHrAdminRole, normalizeRole } from "../../utils/roles.js";

const STATUS_STYLES = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const TYPE_LABELS = { full_day: "Full Day", half_day: "Half Day" };

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseDateList(value) {
  if (!value) return [];
  const items = value
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  return Array.from(new Set(items));
}

function serializeDateList(list) {
  return list.join(", ");
}

function getReviewLabel(req) {
  const reviewer = req.reviewedBy?.name || "—";
  if (req.status === "Approved") return `Approved by: ${reviewer}`;
  if (req.status === "Rejected") return `Rejected by: ${reviewer}`;
  return "Pending approval";
}

export default function LeavePage() {
  const dispatch = useDispatch();
  const { user, isSuperAdmin } = useAuth();
  const role = normalizeRole(user?.role);
  const isTeamAdmin = role === "admin";
  const canReviewLeaves = isHrAdminRole(role) || isSuperAdmin;
  const canViewTeamLeaves = isTeamAdmin || canReviewLeaves || isSuperAdmin;
  const [myLeaves, setMyLeaves] = useState([]);
  const [pending, setPending] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ dates: "", type: "full_day", reason: "" });
  const [saving, setSaving] = useState(false);
  const [pickedDate, setPickedDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  const now = new Date();
  const calParams = { month: now.getMonth() + 1, year: now.getFullYear() };

  const load = async () => {
    setLoading(true);
    try {
      const mine = await getUserLeaves(user._id);
      setMyLeaves(mine);
      if (canViewTeamLeaves) {
        const [cal, p] = await Promise.all([
          getTeamCalendar(calParams),
          canReviewLeaves ? getPendingLeaves() : Promise.resolve([]),
        ]);
        setCalendar(cal);
        setPending(p);
        const allTeam = await getTeamLeaves();
        setTeamLeaves(allTeam);
      } else {
        setCalendar([]);
        setPending([]);
        setTeamLeaves([]);
      }
      if (isSuperAdmin) {
        const all = await getAllLeaves();
        setAllLeaves(all);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dates = parseDateList(form.dates);
      await submitLeave({ ...form, dates });
      dispatch(showToast({ message: "Leave request submitted" }));
      setShowModal(false);
      setForm({ dates: "", type: "full_day", reason: "" });
      setPickedDate("");
      setDateError("");
      load();
    } catch {
      dispatch(showToast({ message: "Failed to submit", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const addPickedDate = () => {
    if (!pickedDate) {
      setDateError("Pick a date to add.");
      return;
    }
    const dates = parseDateList(form.dates);
    if (!dates.includes(pickedDate)) {
      dates.push(pickedDate);
    }
    setForm((f) => ({ ...f, dates: serializeDateList(dates) }));
    setPickedDate("");
    setDateError("");
  };

  const removeDate = (date) => {
    const dates = parseDateList(form.dates).filter((d) => d !== date);
    setForm((f) => ({ ...f, dates: serializeDateList(dates) }));
  };

  const handleReview = async (id, status) => {
    try {
      await reviewLeave(id, { status, reviewNote });
      dispatch(showToast({ message: `Leave ${status.toLowerCase()}` }));
      setReviewingId(null);
      setReviewNote("");
      load();
    } catch {
      dispatch(showToast({ message: "Review failed", type: "error" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">
            Leave & Availability
          </h1>
        </div>
        {!isSuperAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-1"
          >
            <Plus size={14} /> Request Leave
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Pending Approvals (admin) */}
          {canReviewLeaves && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Pending Approvals ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="text-sm text-gray-400">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {pending.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-start justify-between gap-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {req.userId?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {req.dates?.map(formatDate).join(", ")} —{" "}
                          {TYPE_LABELS[req.type]}
                        </p>
                        {req.reason && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            "{req.reason}"
                          </p>
                        )}
                      </div>
                      {reviewingId === req._id ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <input
                            className="input text-xs"
                            placeholder="Optional note..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(req._id, "Approved")}
                              className="btn-primary text-xs py-1 flex items-center gap-1"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(req._id, "Rejected")}
                              className="btn-secondary text-xs py-1 flex items-center gap-1 text-red-600 border-red-200"
                            >
                              <X size={12} /> Reject
                            </button>
                            <button
                              onClick={() => setReviewingId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewingId(req._id)}
                          className="btn-secondary text-xs py-1 flex items-center gap-1"
                        >
                          <Clock size={12} /> Review
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Calendar */}
          {canViewTeamLeaves && calendar.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Team Availability —{" "}
                {now.toLocaleString("default", { month: "long" })}{" "}
                {now.getFullYear()}
              </h2>
              <div className="space-y-2">
                {calendar.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-24 text-sm font-medium text-gray-700">
                      {formatDate(entry.date)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(entry.absent || []).map((name, j) => (
                        <span
                          key={j}
                          className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                        >
                          {name}
                        </span>
                      ))}
                      {(entry.halfDay || []).map((name, j) => (
                        <span
                          key={j}
                          className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full"
                        >
                          {name} (half)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin overview (requests, approvals, rejections) */}
          {canViewTeamLeaves && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Team Leave Requests
              </h2>
              {teamLeaves.length === 0 ? (
                <p className="text-sm text-gray-400">No team requests found.</p>
              ) : (
                <div className="space-y-2">
                  {teamLeaves.map((req) => (
                    <div
                      key={req._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.userId?.name || "Unknown"} —{" "}
                          {TYPE_LABELS[req.type]}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Dates: {req.dates?.map(formatDate).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[req.status]}`}
                        >
                          {req.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          {getReviewLabel(req)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Superadmin overview (who applied and who approved) */}
          {isSuperAdmin && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Leave Applications & Approvals
              </h2>
              {allLeaves.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No leave requests found.
                </p>
              ) : (
                <div className="space-y-2">
                  {allLeaves.map((req) => (
                    <div
                      key={req._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Applied by: {req.userId?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Dates: {req.dates?.map(formatDate).join(", ")}
                        </p>
                      </div>
                      <div className="text-xs text-gray-600">
                        {getReviewLabel(req)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Leave History */}
          {!isSuperAdmin && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                My Leave Requests
              </h2>
              {myLeaves.length === 0 ? (
                <p className="text-sm text-gray-400">No leave requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {myLeaves.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.dates?.map(formatDate).join(", ")}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {TYPE_LABELS[req.type]}
                          {req.reason ? ` — ${req.reason}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[req.status]}`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showModal && !isSuperAdmin && (
        <Modal title="Request Leave" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Dates</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  className="input"
                  value={pickedDate}
                  onChange={(e) => setPickedDate(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addPickedDate}
                  className="btn-secondary"
                >
                  Add date
                </button>
              </div>
              {dateError && (
                <p className="text-xs text-red-600 mt-1">{dateError}</p>
              )}
              {parseDateList(form.dates).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {parseDateList(form.dates).map((d) => (
                    <span
                      key={d}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => removeDate(d)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label={`Remove ${d}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                You can also paste dates as comma-separated YYYY-MM-DD.
              </p>
              <input
                className="input"
                placeholder="2026-05-01, 2026-05-02"
                required
                value={form.dates}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dates: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="full_day">Full Day</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
            <div>
              <label className="label">Reason (optional)</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Submitting..." : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
