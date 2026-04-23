import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  ClipboardCheck,
  FolderOpen,
  Users,
  BarChart2,
  UserCog,
  Target,
  Trophy,
  CalendarOff,
  ShieldCheck,
  FileText,
  Settings,
  Webhook,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    Icon: LayoutDashboard,
    roles: ["user", "admin", "superadmin"],
  },
  {
    to: "/work-units",
    label: "Work Units",
    Icon: ClipboardCheck,
    roles: ["user", "admin", "superadmin"],
  },
  {
    to: "/cases",
    label: "Cases",
    Icon: FolderOpen,
    roles: ["user", "admin", "superadmin"],
  },
  {
    to: "/kpi",
    label: "KPI Targets",
    Icon: Target,
    roles: ["user", "admin", "superadmin"],
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    Icon: Trophy,
    roles: ["admin", "superadmin"],
  },
  {
    to: "/reports",
    label: "Reports",
    Icon: BarChart2,
    roles: ["user", "admin", "superadmin"],
  },
  {
    to: "/leave",
    label: "Leave",
    Icon: CalendarOff,
    roles: ["user", "admin", "superadmin"],
  },
  {
    to: "/eod",
    label: "EOD Reports",
    Icon: FileText,
    roles: ["user", "admin", "superadmin"],
  },
  {
    to: "/team",
    label: "Team View",
    Icon: Users,
    roles: ["admin", "superadmin"],
  },
  {
    to: "/webhooks",
    label: "Webhooks",
    Icon: Webhook,
    roles: ["admin", "superadmin"],
  },
  {
    to: "/audit",
    label: "Audit Log",
    Icon: ShieldCheck,
    roles: ["superadmin"],
  },
  {
    to: "/settings",
    label: "Settings",
    Icon: Settings,
    roles: ["admin", "superadmin"],
  },
  { to: "/users", label: "Users", Icon: UserCog, roles: ["superadmin"] },
];

export default function Sidebar() {
  const open = useSelector((s) => s.ui.sidebarOpen);
  const { user } = useAuth();

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-200 z-30 flex flex-col ${open ? "w-64" : "w-16"}`}
    >
      <div className="flex items-center h-16 px-4 border-b border-gray-700 flex-shrink-0">
        {open ? (
          <span className="font-bold text-brand-400 text-lg truncate">
            ImmigrationCRM
          </span>
        ) : (
          <span className="text-brand-400 text-xl font-bold">I</span>
        )}
      </div>

      <nav className="p-2 space-y-0.5 mt-2 flex-1 overflow-y-auto">
        {navItems
          .filter((item) => {
            if (!item.roles.includes(user?.role)) return false;
            if (item.to !== "/leaderboard") return true;
            if (user?.role === "superadmin") return true;
            return (
              user?.role === "admin" &&
              ["Sales", "Marketing"].includes(user?.team)
            );
          })
          .map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {open && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
      </nav>

      {open && user && (
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="text-xs text-gray-400">{user.role === "superadmin" ? "CEO" : `${user.team} Team`}</div>
          <div className="text-sm font-medium text-white truncate">
            {user.name}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {user.role === "superadmin" ? "Super Admin" : user.role}
          </div>
        </div>
      )}
    </div>
  );
}
