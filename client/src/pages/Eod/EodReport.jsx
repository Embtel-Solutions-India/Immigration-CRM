import React, { useEffect, useState } from "react";
import { FileText, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch } from "react-redux";
import { useAuth } from "../../hooks/useAuth.js";
import { showToast } from "../../store/uiSlice.js";
import Spinner from "../../components/common/Spinner.jsx";
import api from "../../api/axios.js";

const STAT_FIELDS = [
  { key: "tasksCompleted", label: "Tasks Done" },
  {
    key: "totalTimeSpent",
    label: "Hours Logged",
    format: (v) => (v / 60).toFixed(1) + "h",
  },
  { key: "emailsSent", label: "Emails Sent" },
  { key: "callsMade", label: "Calls Made" },
  { key: "leadsUpdated", label: "Leads Updated" },
  { key: "casesMoved", label: "Cases Moved" },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isoDate(d) {
  return d.toISOString().split("T")[0];
}

export default function EodReport() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const isAdminOnly = user?.role === "admin";
  const dispatch = useDispatch();
  const [reports, setReports] = useState([]);
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [teamReports, setTeamReports] = useState([]);
  const [teamSummary, setTeamSummary] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const mine = await api.get(`/eod/user/${user._id}`).then((r) => r.data);
      setReports(mine.reports || []);
      if (isAdminOnly) {
        const team = await api
          .get("/eod/team", { params: { date: selectedDate } })
          .then((r) => r.data);
        setTeamReports(team.reports || []);
      } else {
        setTeamReports([]);
      }
      if (isSuperAdmin) {
        const summary = await api
          .get("/eod/teams/summary", { params: { date: selectedDate } })
          .then((r) => r.data);
        setTeamSummary(summary.teams || []);
      } else {
        setTeamSummary([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedDate]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post(`/eod/generate/${user._id}`);
      dispatch(showToast({ message: "EOD report generated" }));
      load();
    } catch {
      dispatch(showToast({ message: "Generation failed", type: "error" }));
    } finally {
      setGenerating(false);
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const reportByDate = reports.reduce((acc, r) => {
    acc[r.date?.split("T")[0]] = r;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">EOD Reports</h1>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-secondary flex items-center gap-1 text-sm"
        >
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          {generating ? "Generating..." : "Generate Today"}
        </button>
      </div>

      {/* Week Calendar Strip */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-medium text-gray-700">
            {formatDate(weekDays[0])} — {formatDate(weekDays[4])}
          </p>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {weekDays.map((d) => {
            const key = isoDate(d);
            const report = reportByDate[key];
            const isSelected = key === selectedDate;
            const isToday = key === isoDate(new Date());
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? "border-brand-600 bg-brand-50"
                    : report
                      ? "border-green-200 bg-green-50"
                      : "border-gray-100 bg-gray-50"
                }`}
              >
                <p
                  className={`text-xs font-medium ${isToday ? "text-brand-600" : "text-gray-500"}`}
                >
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-bold mt-0.5 ${isSelected ? "text-brand-700" : report ? "text-green-700" : "text-gray-400"}`}
                >
                  {d.getDate()}
                </p>
                {report && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* My EOD for selected date */}
          {(() => {
            const report = reportByDate[selectedDate];
            return (
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-4">
                  My Report — {formatDate(selectedDate)}
                </h2>
                {!report ? (
                  <p className="text-sm text-gray-400">
                    No EOD report for this date.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      {STAT_FIELDS.map((f) => (
                        <div key={f.key} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{f.label}</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {f.format
                              ? f.format(report[f.key] || 0)
                              : report[f.key] || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                    {report.rawSummary && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Summary
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {report.rawSummary}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </>
      )}

      {!loading && isAdminOnly && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Team EOD — {formatDate(selectedDate)}
          </h2>
          {teamReports.length === 0 ? (
            <p className="text-sm text-gray-400">
              No team reports for this date.
            </p>
          ) : (
            <div className="space-y-3">
              {teamReports.map((r) => (
                <div
                  key={r._id}
                  className="p-3 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {r.userId?.name || "Unknown"}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expandedId === r._id ? null : r._id)
                      }
                      className="text-xs text-brand-600 hover:underline"
                    >
                      {expandedId === r._id ? "Hide details" : "View details"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {STAT_FIELDS.map((f) => (
                      <div key={f.key} className="text-center">
                        <p className="text-xs text-gray-400">{f.label}</p>
                        <p className="font-bold text-gray-800 text-sm">
                          {f.format ? f.format(r[f.key] || 0) : r[f.key] || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                  {expandedId === r._id && Array.isArray(r.rawSummary) && (
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      {r.rawSummary.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">
                            {item.title || "Untitled"}
                          </span>
                          <span className="ml-2 text-gray-400">
                            {item.workType || "—"} • {item.status || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && isSuperAdmin && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Team Totals — {formatDate(selectedDate)}
          </h2>
          {teamSummary.length === 0 ? (
            <p className="text-sm text-gray-400">
              No team totals for this date.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {teamSummary.map((t) => (
                <div key={t.team} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">{t.team}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {t.totalWorkUnits || 0}
                  </p>
                  <p className="text-xs text-gray-400">work units</p>
                  {t.categories && Object.keys(t.categories).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(t.categories).map(([type, count]) => (
                        <span
                          key={type}
                          className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                        >
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
