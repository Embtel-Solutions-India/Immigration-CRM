import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
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
  Briefcase,
  BookOpen,
  UserSquare2,
  Upload,
  ListChecks,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { isHrRole, normalizeRole, isDocTeamMember } from "../../utils/roles.js";
import { toggleSidebar } from "../../store/uiSlice.js";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    Icon: LayoutDashboard,
    roles: ["user", "admin", "superadmin", "overall_admin"],
  },
  {
    to: "/work-units",
    label: "Work Units",
    Icon: ClipboardCheck,
    roles: ["user", "admin", "hr_admin", "hr_user", "hr", "superadmin", "overall_admin"],
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
    roles: ["admin", "hr_admin", "hr_user", "hr", "superadmin", "overall_admin"],
  },
  {
    to: "/reports",
    label: "Reports",
    Icon: BarChart2,
    roles: ["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"],
  },
  {
    to: "/leave",
    label: "Leave",
    Icon: CalendarOff,
    roles: ["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"],
  },
  {
    to: "/eod",
    label: "EOD Reports",
    Icon: FileText,
    roles: ["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"],
  },
  {
    to: "/team",
    label: "Team View",
    Icon: Users,
    roles: ["admin", "hr_admin", "superadmin", "overall_admin"],
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
    roles: ["hr_admin", "superadmin"],
  },
  {
    to: "/settings",
    label: "Settings",
    Icon: Settings,
    roles: ["admin", "superadmin"],
  },
  { to: "/users", label: "Users", Icon: UserCog, roles: ["superadmin"] },
  { to: "/hr", label: "HR Portal", Icon: Briefcase, roles: ["hr_admin", "hr"] },
];

const docNavItems = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/doc/clients", label: "Clients", Icon: UserSquare2 },
  { to: "/doc/cases", label: "Cases", Icon: FolderOpen },
  { to: "/doc/work-units", label: "Work Units", Icon: ClipboardCheck },
  { to: "/doc/documents", label: "Documents", Icon: BookOpen, end: true },
  { to: "/doc/documents/new", label: "Upload Doc", Icon: Upload },
  { to: "/doc/leaderboard", label: "Leaderboard", Icon: Trophy, adminOnly: true },
  { to: "/leave", label: "Leave", Icon: CalendarOff },
  { to: "/eod", label: "EOD Reports", Icon: FileText },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.sidebarOpen);
  const { user } = useAuth();

  const normalizedRole = normalizeRole(user?.role);
  const isHrTeamUser =
    normalizedRole === "hr_user" ||
    (normalizedRole === "user" && user?.team === "HR");
  const isDocUser = isDocTeamMember(user);

  // Close sidebar on mobile after navigating
  const handleNavClick = () => {
    if (window.innerWidth < 768) dispatch(toggleSidebar());
  };

  return (
    <>
      {/* Mobile backdrop — clicking it closes the sidebar */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 z-30 flex flex-col
          ${open
            ? "w-64 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-16"
          }`}
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
          {isDocUser && open && (
            <div className="px-3 py-1.5 mb-1">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Documentation</span>
            </div>
          )}
          {(isDocUser ? docNavItems : navItems)
            .filter((item) => {
              if (isDocUser) {
                if (item.adminOnly && normalizedRole !== "admin") return false;
                return true;
              }
              if (!item.roles.includes(normalizedRole)) return false;
              if (isHrTeamUser && (item.to === "/cases" || item.to === "/kpi")) return false;
              if (item.to !== "/leaderboard") return true;
              if (isHrRole(normalizedRole)) return true;
              if (normalizedRole === "superadmin") return true;
              if (normalizedRole === "overall_admin") return true;
              return (
                normalizedRole === "admin" &&
                ["Sales", "Marketing"].includes(user?.team)
              );
            })
            .map(({ to, label, Icon, end: itemEnd }) => (
              <NavLink
                key={to}
                to={to}
                end={!!itemEnd}
                onClick={handleNavClick}
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
            <div className="text-xs text-gray-400">
              {normalizedRole === "superadmin"
                ? "CEO"
                : normalizedRole === "overall_admin"
                ? "All Teams"
                : user.team === "HR"
                ? "HR Team"
                : user.team === "Documentation"
                ? "Documentation Team"
                : `${user.team} Team`}
            </div>
            <div className="text-sm font-medium text-white truncate">
              {user.name}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {normalizedRole === "superadmin"
                ? "Super Admin"
                : normalizedRole === "overall_admin"
                ? "Organization Admin"
                : normalizedRole.replace("_", " ")}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
