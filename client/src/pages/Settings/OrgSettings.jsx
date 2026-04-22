import React, { useEffect, useState } from "react";
import { Settings, Video, Plus, X, Mail, Clock } from "lucide-react";
import { useDispatch } from "react-redux";
import { getOrgSettings, updateOrgSettings } from "../../api/orgApi.js";
import { showToast } from "../../store/uiSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import Spinner from "../../components/common/Spinner.jsx";

export default function OrgSettings() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const dispatch = useDispatch();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ceoZoomLink: "",
    eodReportTime: "18:00",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    ghlWebhookSecret: "",
  });
  const [newVisa, setNewVisa] = useState("");
  const [newReviewer, setNewReviewer] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const s = await getOrgSettings();
      setSettings(s);
      setForm({
        ceoZoomLink: s.ceoZoomLink || "",
        eodReportTime: s.eodReportTime || "18:00",
        smtpHost: s.smtpConfig?.host || "",
        smtpPort: s.smtpConfig?.port?.toString() || "587",
        smtpUser: s.smtpConfig?.user || "",
        smtpPass: "",
        smtpFrom: s.smtpConfig?.from || "",
        ghlWebhookSecret: "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ceoZoomLink: form.ceoZoomLink,
        eodReportTime: form.eodReportTime,
        smtpConfig: {
          host: form.smtpHost,
          port: parseInt(form.smtpPort),
          user: form.smtpUser,
          from: form.smtpFrom,
          ...(form.smtpPass ? { pass: form.smtpPass } : {}),
        },
        ...(form.ghlWebhookSecret
          ? { ghlWebhookSecret: form.ghlWebhookSecret }
          : {}),
      };
      await updateOrgSettings(payload);
      dispatch(showToast({ message: "Settings saved" }));
      localStorage.setItem("orgSettingsUpdatedAt", Date.now().toString());
      window.dispatchEvent(new Event("org-settings-updated"));
      load();
    } catch {
      dispatch(showToast({ message: "Save failed", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleAddVisa = async () => {
    if (!newVisa.trim()) return;
    try {
      await updateOrgSettings({
        visaCategories: [...(settings?.visaCategories || []), newVisa.trim()],
      });
      dispatch(showToast({ message: "Visa category added" }));
      setNewVisa("");
      load();
    } catch {
      dispatch(showToast({ message: "Failed", type: "error" }));
    }
  };

  const handleRemoveVisa = async (cat) => {
    try {
      const updated = (settings?.visaCategories || []).filter((v) => v !== cat);
      await updateOrgSettings({ visaCategories: updated });
      load();
    } catch {
      dispatch(showToast({ message: "Failed", type: "error" }));
    }
  };

  const handleAddReviewer = async () => {
    if (!newReviewer.trim()) return;
    try {
      await updateOrgSettings({
        internalReviewers: [
          ...(settings?.internalReviewers || []),
          newReviewer.trim(),
        ],
      });
      dispatch(showToast({ message: "Reviewer added" }));
      setNewReviewer("");
      load();
    } catch {
      dispatch(showToast({ message: "Failed", type: "error" }));
    }
  };

  const handleRemoveReviewer = async (name) => {
    try {
      const updated = (settings?.internalReviewers || []).filter(
        (r) => r !== name,
      );
      await updateOrgSettings({ internalReviewers: updated });
      load();
    } catch {
      dispatch(showToast({ message: "Failed", type: "error" }));
    }
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="text-center py-24 text-gray-400">
        Admin access required
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-brand-600" />
        <h1 className="text-xl font-bold text-gray-900">
          Organization Settings
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* CEO Zoom Link */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Video size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">CEO Zoom Meeting</h2>
          </div>
          <div>
            <label className="label">Zoom Link</label>
            <input
              className="input"
              type="url"
              placeholder="https://us02web.zoom.us/j/..."
              value={form.ceoZoomLink}
              onChange={(e) =>
                setForm((f) => ({ ...f, ceoZoomLink: e.target.value }))
              }
            />
            <p className="text-xs text-gray-400 mt-1">
              This link appears as a quick-join button in the top navigation
              bar.
            </p>
          </div>
        </div>

        {/* EOD Report Time */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">EOD Report Schedule</h2>
          </div>
          <div>
            <label className="label">Auto-generate time (24h format)</label>
            <input
              className="input max-w-[120px]"
              type="time"
              value={form.eodReportTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, eodReportTime: e.target.value }))
              }
            />
          </div>
        </div>

        {/* SMTP Config */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Email (SMTP)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SMTP Host</label>
              <input
                className="input"
                placeholder="smtp.gmail.com"
                value={form.smtpHost}
                onChange={(e) =>
                  setForm((f) => ({ ...f, smtpHost: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Port</label>
              <input
                className="input"
                type="number"
                placeholder="587"
                value={form.smtpPort}
                onChange={(e) =>
                  setForm((f) => ({ ...f, smtpPort: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">SMTP Username</label>
              <input
                className="input"
                type="email"
                placeholder="user@domain.com"
                value={form.smtpUser}
                onChange={(e) =>
                  setForm((f) => ({ ...f, smtpUser: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Password (leave blank to keep)</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.smtpPass}
                onChange={(e) =>
                  setForm((f) => ({ ...f, smtpPass: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className="label">From Address</label>
              <input
                className="input"
                type="email"
                placeholder="noreply@company.com"
                value={form.smtpFrom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, smtpFrom: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Webhook Secret */}
        {isSuperAdmin && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">GoHighLevel Webhook</h2>
            <div>
              <label className="label">Webhook Secret (HMAC SHA-256)</label>
              <input
                className="input font-mono text-sm"
                type="password"
                placeholder="Enter new secret to update..."
                value={form.ghlWebhookSecret}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ghlWebhookSecret: e.target.value }))
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Webhook endpoint:{" "}
                <span className="font-mono text-gray-600">
                  /api/webhooks/gohighlevel
                </span>
              </p>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      {/* Visa Categories */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Visa Categories</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {(settings?.visaCategories || []).map((cat) => (
            <span
              key={cat}
              className="flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-200 text-sm px-3 py-1 rounded-full"
            >
              {cat}
              <button
                onClick={() => handleRemoveVisa(cat)}
                className="ml-1 hover:text-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input max-w-[200px] text-sm"
            placeholder="e.g. H-1B, EB-2..."
            value={newVisa}
            onChange={(e) => setNewVisa(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddVisa())
            }
          />
          <button
            onClick={handleAddVisa}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Internal Reviewers */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Internal Case Reviewers
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {(settings?.internalReviewers || []).map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 bg-gray-100 text-gray-700 border border-gray-200 text-sm px-3 py-1 rounded-full"
            >
              {name}
              <button
                onClick={() => handleRemoveReviewer(name)}
                className="ml-1 hover:text-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input max-w-[200px] text-sm"
            placeholder="Reviewer name..."
            value={newReviewer}
            onChange={(e) => setNewReviewer(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddReviewer())
            }
          />
          <button
            onClick={handleAddReviewer}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
