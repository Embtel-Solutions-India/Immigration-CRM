import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, Plus } from "lucide-react";
import { getCases, createCase } from "../../api/caseApi.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Modal from "../../components/common/Modal.jsx";
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

const STAGE_COLORS = {
  "Document Collection": "bg-gray-50 border-gray-200",
  "Application Drafted": "bg-blue-50 border-blue-200",
  "Internal Team Review": "bg-purple-50 border-purple-200",
  "Client Review": "bg-yellow-50 border-yellow-200",
  "Petition Filed": "bg-indigo-50 border-indigo-200",
  "Under Government Review": "bg-orange-50 border-orange-200",
  Approved: "bg-green-50 border-green-200",
};

export default function CaseBoard() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const dispatch = useDispatch();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCase, setNewCase] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    visaCategory: "",
    priority: "Normal",
    slaDeadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getCases({ limit: 500 });
      setCases(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byStage = (stage) =>
    cases.filter(
      (c) =>
        c.stage === stage &&
        (!filter || c.clientName.toLowerCase().includes(filter.toLowerCase())),
    );

  const isOverdue = (c) =>
    c.slaDeadline &&
    new Date(c.slaDeadline) < new Date() &&
    c.stage !== "Approved";

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCase(newCase);
      dispatch(showToast({ message: "Case created" }));
      setShowModal(false);
      setNewCase({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        visaCategory: "",
        priority: "Normal",
        slaDeadline: "",
      });
      load();
    } catch (err) {
      const status = err?.response?.status;
      const message =
        status === 403
          ? "You do not have permission to create cases."
          : status === 401
            ? "Your session expired. Please sign in again."
            : "Failed to create case.";
      dispatch(showToast({ message }));
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Cases{" "}
          <span className="text-gray-400 font-normal text-base">
            ({cases.length})
          </span>
        </h1>
        <div className="flex gap-2">
          <input
            className="input w-48 text-sm"
            placeholder="Search client..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {(isAdmin || isSuperAdmin) && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-1"
            >
              <Plus size={14} /> New Case
            </button>
          )}
        </div>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ minHeight: "60vh" }}
      >
        {STAGES.map((stage) => {
          const stageCases = byStage(stage);
          return (
            <div
              key={stage}
              className={`rounded-xl border ${STAGE_COLORS[stage]} flex-shrink-0 w-52`}
            >
              <div className="px-3 py-2.5 border-b border-inherit">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-700 leading-tight">
                    {stage}
                  </span>
                  <span className="text-xs bg-white text-gray-600 rounded-full px-2 py-0.5 font-medium flex-shrink-0">
                    {stageCases.length}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {stageCases.map((c) => (
                  <Link
                    key={c._id}
                    to={`/cases/${c._id}`}
                    className={`block bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border ${isOverdue(c) ? "border-red-200" : "border-transparent"}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-semibold text-gray-900 leading-snug">
                        {c.clientName}
                      </p>
                      {isOverdue(c) && (
                        <AlertTriangle
                          size={12}
                          className="text-red-500 flex-shrink-0 mt-0.5"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.visaCategory || c.caseType}
                    </p>
                    {c.caseId && (
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        {c.caseId}
                      </p>
                    )}
                    {c.slaDeadline && (
                      <p
                        className={`text-xs mt-1 ${isOverdue(c) ? "text-red-500 font-medium" : "text-gray-400"}`}
                      >
                        Due {format(new Date(c.slaDeadline), "MMM d")}
                      </p>
                    )}
                    {c.priority && c.priority !== "Normal" && (
                      <span
                        className={`inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                          c.priority === "Urgent"
                            ? "bg-red-100 text-red-700"
                            : c.priority === "High"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.priority}
                      </span>
                    )}
                  </Link>
                ))}
                {stageCases.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="New Case" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Client Name</label>
              <input
                className="input"
                required
                value={newCase.clientName}
                onChange={(e) =>
                  setNewCase((f) => ({ ...f, clientName: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Client Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="client@example.com"
                  value={newCase.clientEmail}
                  onChange={(e) =>
                    setNewCase((f) => ({ ...f, clientEmail: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Client Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 555 123 4567"
                  value={newCase.clientPhone}
                  onChange={(e) =>
                    setNewCase((f) => ({ ...f, clientPhone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="label">Case Type</label>
              <input
                className="input"
                required
                placeholder="H-1B, Green Card, DACA..."
                value={newCase.visaCategory}
                onChange={(e) =>
                  setNewCase((f) => ({ ...f, visaCategory: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={newCase.priority}
                  onChange={(e) =>
                    setNewCase((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="label">Deadline (SLA)</label>
                <input
                  type="date"
                  className="input"
                  value={newCase.slaDeadline}
                  onChange={(e) =>
                    setNewCase((f) => ({ ...f, slaDeadline: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Creating..." : "Create Case"}
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
