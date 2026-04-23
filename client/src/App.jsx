import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth, refreshAuth } from "./store/authSlice.js";
import Layout from "./components/layout/Layout.jsx";
import Login from "./pages/Auth/Login.jsx";
import UserDashboard from "./pages/Dashboard/UserDashboard.jsx";
import AdminDashboard from "./pages/Dashboard/AdminDashboard.jsx";
import CeoDashboard from "./pages/Dashboard/CeoDashboard.jsx";
import WorkUnitList from "./pages/WorkUnits/WorkUnitList.jsx";
import WorkUnitDetail from "./pages/WorkUnits/WorkUnitDetail.jsx";
import WorkUnitForm from "./pages/WorkUnits/WorkUnitForm.jsx";
import CaseBoard from "./pages/Cases/CaseBoard.jsx";
import CaseDetail from "./pages/Cases/CaseDetail.jsx";
import TeamView from "./pages/Team/TeamView.jsx";
import Reports from "./pages/Reports/Reports.jsx";
import UserManagement from "./pages/Admin/UserManagement.jsx";
import KpiPage from "./pages/Kpi/KpiPage.jsx";
import Leaderboard from "./pages/Leaderboard/Leaderboard.jsx";
import LeavePage from "./pages/Leave/LeavePage.jsx";
import HRPortal from "./pages/HR/HRPortal.jsx";
import AuditLog from "./pages/Audit/AuditLog.jsx";
import EodReport from "./pages/Eod/EodReport.jsx";
import OrgSettings from "./pages/Settings/OrgSettings.jsx";
import WebhookLogs from "./pages/Webhooks/WebhookLogs.jsx";
import { isHrAdminRole, normalizeRole } from "./utils/roles.js";

function ProtectedRoute({ children, roles, denyHrTeamUsers = false }) {
  const { user, loading } = useSelector((s) => s.auth);
  const userRole = normalizeRole(user?.role);
  const isHrTeamUser = userRole === "hr_user" || (userRole === "user" && user?.team === "HR");
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.map((r) => normalizeRole(r)).includes(userRole)) return <Navigate to="/" replace />;
  if (denyHrTeamUsers && isHrTeamUser) return <Navigate to="/" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useSelector((s) => s.auth);
  if (!user) return null;
  const role = normalizeRole(user.role);
  if (isHrAdminRole(role)) return <Navigate to="/hr" replace />;
  if (role === "superadmin") return <CeoDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <UserDashboard />;
}

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(refreshAuth());
  }, [dispatch]);

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(clearAuth());
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRouter />} />
          <Route
            path="work-units"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "hr", "superadmin"]}>
                <WorkUnitList />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-units/new"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin"]}>
                <WorkUnitForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-units/:id"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "hr", "superadmin"]}>
                <WorkUnitDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-units/:id/edit"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin"]}>
                <WorkUnitForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="cases"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]} denyHrTeamUsers>
                <CaseBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="cases/:id"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]} denyHrTeamUsers>
                <CaseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="kpi"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]} denyHrTeamUsers>
                <KpiPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaderboard"
            element={
              <ProtectedRoute roles={["admin", "hr_admin", "hr_user", "hr", "superadmin"]}>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="leave"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin"]}>
                <LeavePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="eod"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin"]}>
                <EodReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="team"
            element={
              <ProtectedRoute roles={["admin", "hr_admin", "superadmin"]}>
                <TeamView />
              </ProtectedRoute>
            }
          />
          <Route
            path="webhooks"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <WebhookLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <OrgSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit"
            element={
              <ProtectedRoute roles={["hr_admin", "superadmin"]}>
                <AuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="hr"
            element={
              <ProtectedRoute roles={["hr_admin", "hr"]}>
                <HRPortal />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
