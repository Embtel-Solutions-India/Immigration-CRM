import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Clock,
  TrendingDown,
  CalendarOff,
  Info,
} from "lucide-react";
import { markRead, markUnread } from "../../api/notificationApi.js";

const TYPE_ICON = {
  task_deadline: <Clock size={14} className="text-amber-500" />,
  lead_cold: <TrendingDown size={14} className="text-blue-500" />,
  case_stuck: <AlertTriangle size={14} className="text-orange-500" />,
  filing_deadline: <AlertTriangle size={14} className="text-red-500" />,
  inactivity: <AlertTriangle size={14} className="text-gray-400" />,
  kpi_miss: <TrendingDown size={14} className="text-red-500" />,
  leave_update: <CalendarOff size={14} className="text-purple-500" />,
  general: <Info size={14} className="text-gray-400" />,
};

export default function NotificationPanel({
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await markRead(n._id);
      onMarkRead?.(n._id, true);
    }
    if (n.linkTo) {
      navigate(n.linkTo);
      onClose();
    }
  };

  const handleMarkSingle = async (e, n) => {
    e.stopPropagation();
    if (n.isRead) {
      await markUnread(n._id);
      onMarkRead?.(n._id, false);
      return;
    }
    await markRead(n._id);
    onMarkRead?.(n._id, true);
  };

  const handleMarkAll = async () => {
    await onMarkAllRead?.();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-600" />
          <span className="font-semibold text-gray-900 text-sm">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-brand-600 hover:underline flex items-center gap-1"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            No notifications
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 ${!n.isRead ? "bg-blue-50/40" : ""}`}
            > 
              <div className="mt-0.5 flex-shrink-0">
                {TYPE_ICON[n.type] || TYPE_ICON.general}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${n.isRead ? "text-gray-600" : "text-gray-900 font-medium"}`}
                >
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(n.createdAt), "MMM d, h:mm a")}
                </p>
                <button
                  type="button"
                  onClick={(e) => handleMarkSingle(e, n)}
                  className="mt-1 text-xs text-brand-600 hover:underline"
                >
                  {n.isRead ? "Mark as unread" : "Mark as read"}
                </button>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
