import React, { useEffect, useState } from "react";
import { Calendar, Users, CheckSquare, Plus, Check, X, Clock, UserPlus } from "lucide-react";
import { useDispatch } from "react-redux";
import {
  submitLeave,
  reviewLeave,
  getPendingLeaves,
  getUserLeaves,
  getAllLeaves,
} from "../../api/leaveApi.js";
import { getUsers, updateUser, registerUser } from "../../api/userApi.js";
import { showToast } from "../../store/uiSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import Modal from "../../components/common/Modal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import api from "../../api/axios.js";
import { getWorkUnits } from "../../api/workUnitApi.js";
import { normalizeRole } from "../../utils/roles.js";

const STATUS_STYLES = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const TYPE_LABELS = { full_day: "Full Day", half_day: "Half Day" };
const TEAM_ORDER = ["Sales", "Marketing", "Production", "HR"];

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
  const reviewer = req.reviewedBy?.name || "-";
  if (req.status === "Approved") return `Approved by: ${reviewer}`;
  if (req.status === "Rejected") return `Rejected by: ${reviewer}`;
  return "Pending approval";
}

export default function HRPortal() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leaves");

  const [pending, setPending] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ dates: "", type: "full_day", reason: "" });
  const [savingLeave, setSavingLeave] = useState(false);
  const [pickedDate, setPickedDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", team: "Sales", role: "user" });
  const [savingUser, setSavingUser] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [promoteFor, setPromoteFor] = useState(null);
  const [promoteTeam, setPromoteTeam] = useState("Sales");
  const [promotePassword, setPromotePassword] = useState("");
  const [savingPromotion, setSavingPromotion] = useState(false);

  const [teamReports, setTeamReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadCoreData = async () => {
    const [, pendingLeaves, all, userList] = await Promise.all([
      getUserLeaves(user._id),
      getPendingLeaves(),
      getAllLeaves(),
      getUsers(),
    ]);
    setPending(pendingLeaves);
    setAllLeaves(all);
    setUsers(userList);
  };

  const loadPerformanceData = async (date) => {
    const [eodReports, unitResponse] = await Promise.all([
      api.get("/eod/team", { params: { date } }).then((r) => r.data),
      getWorkUnits({ date, page: 1, limit: 200 }),
    ]);

    setTeamReports(eodReports.reports || []);
    setTasks(unitResponse.items || []);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCoreData(), loadPerformanceData(selectedDate)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadPerformanceData(selectedDate);
  }, [selectedDate, user?._id]);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSavingLeave(true);
    try {
      const dates = parseDateList(leaveForm.dates);
      await submitLeave({ ...leaveForm, dates });
      dispatch(showToast({ message: "Leave request submitted" }));
      setShowLeaveModal(false);
      setLeaveForm({ dates: "", type: "full_day", reason: "" });
      setPickedDate("");
      setDateError("");
      loadCoreData();
    } catch {
      dispatch(showToast({ message: "Failed to submit", type: "error" }));
    } finally {
      setSavingLeave(false);
    }
  };

  const addPickedDate = () => {
    if (!pickedDate) {
      setDateError("Pick a date to add.");
      return;
    }
    const dates = parseDateList(leaveForm.dates);
    if (!dates.includes(pickedDate)) {
      dates.push(pickedDate);
    }
    setLeaveForm((f) => ({ ...f, dates: serializeDateList(dates) }));
    setPickedDate("");
    setDateError("");
  };

  const removeDate = (date) => {
    const dates = parseDateList(leaveForm.dates).filter((d) => d !== date);
    setLeaveForm((f) => ({ ...f, dates: serializeDateList(dates) }));
  };

  const handleReview = async (id, status) => {
    try {
      await reviewLeave(id, { status, reviewNote });
      dispatch(showToast({ message: `Leave ${status.toLowerCase()}` }));
      setReviewingId(null);
      setReviewNote("");
      loadCoreData();
    } catch {
      dispatch(showToast({ message: "Review failed", type: "error" }));
    }
  };

  const toggleActive = async (u) => {
    try {
      await updateUser(u._id, { isActive: !u.isActive });
      dispatch(showToast({ message: `${u.name} ${u.isActive ? "deactivated" : "activated"}` }));
      loadCoreData();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || "Action failed", type: "error" }));
    }
  };

  const changeRole = async (u, role) => {
    const currentRole = normalizeRole(u.role);
    if (role === "admin" && currentRole !== "admin") {
      setPromoteFor(u);
      setPromoteTeam(u.team || "Sales");
      setPromotePassword("");
      return;
    }
    try {
      await updateUser(u._id, { role, team: u.team || "Sales" });
      dispatch(showToast({ message: `${u.name} is now ${role}` }));
      loadCoreData();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || "Role update failed", type: "error" }));
    }
  };

  const handlePromoteToAdmin = async (e) => {
    e.preventDefault();
    if (!promoteFor) return;
    setSavingPromotion(true);
    try {
      await updateUser(promoteFor._id, {
        role: "admin",
        team: promoteTeam,
        password: promotePassword,
      });
      dispatch(showToast({ message: `${promoteFor.name} promoted to admin` }));
      setPromoteFor(null);
      setPromotePassword("");
      setPromoteTeam("Sales");
      loadCoreData();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || "Role update failed", type: "error" }));
    } finally {
      setSavingPromotion(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetFor) return;
    setSavingPassword(true);
    try {
      await updateUser(resetFor._id, { password: newPassword });
      dispatch(showToast({ message: `New credentials set for ${resetFor.name}` }));
      setResetFor(null);
      setNewPassword("");
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || "Password reset failed", type: "error" }));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      await registerUser(newUser);
      dispatch(showToast({ message: "User created" }));
      setShowUserModal(false);
      setNewUser({ name: "", email: "", password: "", team: "Sales", role: "user" });
      loadCoreData();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || "Error creating user", type: "error" }));
    } finally {
      setSavingUser(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const tasksByTeam = tasks.reduce((acc, task) => {
    const team = task.team || "Unknown";
    if (!acc[team]) acc[team] = [];
    acc[team].push(task);
    return acc;
  }, {});

  const eodByTeam = teamReports.reduce((acc, report) => {
    const team = report.userId?.team || "Unknown";
    if (!acc[team]) acc[team] = [];
    acc[team].push(report);
    return acc;
  }, {});

  const orderedTaskTeams = Object.keys(tasksByTeam).sort((a, b) => {
    const ai = TEAM_ORDER.indexOf(a);
    const bi = TEAM_ORDER.indexOf(b);
    const safeA = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const safeB = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return safeA - safeB || a.localeCompare(b);
  });

  const orderedEodTeams = Object.keys(eodByTeam).sort((a, b) => {
    const ai = TEAM_ORDER.indexOf(a);
    const bi = TEAM_ORDER.indexOf(b);
    const safeA = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const safeB = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return safeA - safeB || a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">HR Portal</h1>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("leaves")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "leaves"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              Leave Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserPlus size={16} />
              User Management
            </div>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "tasks"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare size={16} />
              Tasks and EOD
            </div>
          </button>
        </nav>
      </div>

      {activeTab === "leaves" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Leave Management</h2>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="btn-primary flex items-center gap-1"
            >
              <Plus size={14} /> Request Leave
            </button>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              Pending Approvals ({pending.length})
            </h3>
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
                        {req.dates?.map(formatDate).join(", ")} - {TYPE_LABELS[req.type]}
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

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">All Leave Requests</h3>
            {allLeaves.length === 0 ? (
              <p className="text-sm text-gray-400">No leave requests found.</p>
            ) : (
              <div className="space-y-2">
                {allLeaves.map((req) => (
                  <div
                    key={req._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {req.userId?.name || "Unknown"} - {TYPE_LABELS[req.type]}
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
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <button onClick={() => setShowUserModal(true)} className="btn-primary flex items-center gap-1">
              <UserPlus size={14} /> Add User
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Credentials</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const normalizedTargetRole = normalizeRole(u.role);
                  const isProtected = normalizedTargetRole === "superadmin" || normalizedTargetRole === "hr_admin";
                  return (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {u.name[0]}
                          </div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500">{u.team || "Not assigned"}</td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                          value={normalizedTargetRole}
                          disabled={isProtected}
                          onChange={(e) => changeRole(u, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="hr_user">HR User</option>
                          {normalizedTargetRole === "hr_admin" && <option value="hr_admin">HR Admin</option>}
                          {normalizedTargetRole === "superadmin" && <option value="superadmin">Super Admin</option>}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={isProtected}
                          onClick={() => {
                            setResetFor(u);
                            setNewPassword("");
                          }}
                          className="text-xs text-brand-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                        >
                          Set Password
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={isProtected}
                          onClick={() => toggleActive(u)}
                          className={`text-xs hover:underline disabled:text-gray-400 disabled:no-underline ${u.isActive ? "text-red-500" : "text-green-600"}`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Tasks Completed/Logged by Team</h3>
              <input
                type="date"
                className="input text-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400">No task entries for {formatDate(selectedDate)}.</p>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
                {orderedTaskTeams.map((team) => (
                  <div key={team} className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {team} Team ({tasksByTeam[team].length})
                    </h4>
                    {tasksByTeam[team].map((task) => (
                      <div key={task._id} className="border border-gray-100 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-gray-900">{task.title || "Untitled task"}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            task.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : task.status === "In Progress"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}>
                            {task.status || "Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          User: {task.userId?.name || "Unknown"} | Type: {task.workType || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">EOD Reports by Team</h3>
            </div>
            {teamReports.length === 0 ? (
              <p className="text-sm text-gray-400">No EOD reports for {formatDate(selectedDate)}.</p>
            ) : (
              <div className="space-y-4">
                {orderedEodTeams.map((team) => (
                  <div key={team} className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {team} Team ({eodByTeam[team].length})
                    </h4>
                    {eodByTeam[team].map((report) => (
                      <div key={report._id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">
                            {report.userId?.name || "Unknown"}
                          </p>
                          <button
                            onClick={() => setExpandedReportId(expandedReportId === report._id ? null : report._id)}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            {expandedReportId === report._id ? "Hide details" : "View details"}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs text-gray-400">Tasks</p>
                            <p className="font-bold text-sm">{report.tasksCompleted || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Hours</p>
                            <p className="font-bold text-sm">{((report.totalTimeSpent || 0) / 60).toFixed(1)}h</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Cases</p>
                            <p className="font-bold text-sm">{report.casesMoved || 0}</p>
                          </div>
                        </div>
                        {expandedReportId === report._id && report.rawSummary && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(report.rawSummary, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showLeaveModal && (
        <Modal title="Request Leave" onClose={() => setShowLeaveModal(false)}>
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
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
              {parseDateList(leaveForm.dates).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {parseDateList(leaveForm.dates).map((d) => (
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
                        x
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
                value={leaveForm.dates}
                onChange={(e) =>
                  setLeaveForm((f) => ({ ...f, dates: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={leaveForm.type}
                onChange={(e) =>
                  setLeaveForm((f) => ({ ...f, type: e.target.value }))
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
                value={leaveForm.reason}
                onChange={(e) =>
                  setLeaveForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingLeave} className="btn-primary">
                {savingLeave ? "Submitting..." : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showUserModal && (
        <Modal title="Add New User" onClose={() => setShowUserModal(false)}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required value={newUser.name} onChange={(e) => setNewUser((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" required value={newUser.email} onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" required value={newUser.password} onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Team</label>
                <select className="input" value={newUser.team} onChange={(e) => setNewUser((f) => ({ ...f, team: e.target.value }))}>
                  <option>Sales</option>
                  <option>Marketing</option>
                  <option>Production</option>
                  <option>HR</option>
                </select>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={newUser.role} onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="hr_user">HR User</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingUser} className="btn-primary">{savingUser ? "Creating..." : "Create User"}</button>
              <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {resetFor && (
        <Modal title={`Set Password: ${resetFor.name}`} onClose={() => setResetFor(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="label">New Password *</label>
              <input
                type="password"
                className="input"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new login password"
              />
            </div>
            <p className="text-xs text-gray-500">
              Share these credentials with the user:
              <br />
              <span className="font-medium">Email:</span> {resetFor.email}
            </p>
            <div className="flex gap-3">
              <button type="submit" disabled={savingPassword} className="btn-primary">
                {savingPassword ? "Saving..." : "Update Password"}
              </button>
              <button type="button" onClick={() => setResetFor(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {promoteFor && (
        <Modal title={`Promote to Admin: ${promoteFor.name}`} onClose={() => setPromoteFor(null)}>
          <form onSubmit={handlePromoteToAdmin} className="space-y-4">
            <div>
              <label className="label">Team *</label>
              <select
                className="input"
                required
                value={promoteTeam}
                onChange={(e) => setPromoteTeam(e.target.value)}
              >
                <option>Sales</option>
                <option>Marketing</option>
                <option>Production</option>
              </select>
            </div>
            <div>
              <label className="label">New Password *</label>
              <input
                type="password"
                className="input"
                required
                value={promotePassword}
                onChange={(e) => setPromotePassword(e.target.value)}
                placeholder="Set password for new admin credentials"
              />
            </div>
            <p className="text-xs text-gray-500">
              Share these credentials with the user:
              <br />
              <span className="font-medium">Email:</span> {promoteFor.email}
            </p>
            <div className="flex gap-3">
              <button type="submit" disabled={savingPromotion} className="btn-primary">
                {savingPromotion ? "Saving..." : "Promote and Set Credentials"}
              </button>
              <button type="button" onClick={() => setPromoteFor(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
