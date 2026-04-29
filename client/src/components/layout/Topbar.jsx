import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Menu, Video, Bell, Plus, LogOut } from "lucide-react";
import { format } from "date-fns";
import { toggleSidebar } from "../../store/uiSlice.js";
import { logout } from "../../store/authSlice.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getNotifications, markAllRead } from "../../api/notificationApi.js";
import { getOrgSettings } from "../../api/orgApi.js";
import NotificationPanel from "../common/NotificationPanel.jsx";
import { isHrAdminRole, normalizeRole } from "../../utils/roles.js";

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [zoomLink, setZoomLink] = useState("");
  const normalizedRole = normalizeRole(user?.role);
  const notifRef = useRef(null);

  const refreshNotifications = useCallback(() => {
    if (!user?._id) return;
    getNotifications()
      .then((data) => {
        const list = data.notifications || data || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  }, [user?._id]);

  useEffect(() => {
    refreshNotifications();
    const intervalId = setInterval(refreshNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [refreshNotifications]);

  const refreshZoomLink = useCallback(() => {
    getOrgSettings()
      .then((s) => {
        setZoomLink(s?.ceoZoomLink || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshZoomLink();
    const intervalId = setInterval(refreshZoomLink, 30000);
    const onSettingsUpdate = () => refreshZoomLink();
    const onStorage = (e) => {
      if (e.key === "orgSettingsUpdatedAt") refreshZoomLink();
    };
    window.addEventListener("org-settings-updated", onSettingsUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("org-settings-updated", onSettingsUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshZoomLink]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotifUpdate = (id, isRead) => {
    setNotifications((n) => {
      const prev = n.find((x) => x._id === id);
      if (!prev) return n;

      if (prev.isRead === isRead) return n;

      setUnreadCount((c) => (isRead ? Math.max(0, c - 1) : c + 1));
      return n.map((x) => (x._id === id ? { ...x, isRead } : x));
    });
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm text-gray-500 hidden sm:block">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* CEO Zoom Quick-Join */}
        {zoomLink && !isHrAdminRole(normalizedRole) && (
          <a
            href={zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Video size={14} />
            Join Meeting
          </a>
        )}

        {/* New Work Unit */}
        {normalizedRole !== "hr_admin" && (
          <button
            onClick={() => navigate("/work-units/new")}
            className="flex items-center gap-1 btn-primary text-sm"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Work Unit</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationPanel
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onMarkRead={handleNotifUpdate}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {/* User avatar + logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
