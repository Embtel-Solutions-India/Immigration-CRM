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
import { isHrAdminRole, isOverallAdminRole, normalizeRole, isDocTeamMember } from "./utils/roles.js";
import OverallAdminDashboard from "./pages/Dashboard/OverallAdminDashboard.jsx";
import DocDashboard from "./pages/Documentation/DocDashboard.jsx";
import DocLeaderboard from "./pages/Documentation/DocLeaderboard.jsx";
import DocClients from "./pages/Documentation/DocClients.jsx";
import DocClientDetail from "./pages/Documentation/DocClientDetail.jsx";
import DocCases from "./pages/Documentation/DocCases.jsx";
import DocWorkUnits from "./pages/Documentation/DocWorkUnits.jsx";
import DocDocuments from "./pages/Documentation/DocDocuments.jsx";
import DocUploadForm from "./pages/Documentation/DocUploadForm.jsx";
import DocChecklist from "./pages/Documentation/DocChecklist.jsx";

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
  if (isOverallAdminRole(role)) return <OverallAdminDashboard />;
  if (role === "admin" && isDocTeamMember(user)) return <DocDashboard />;
  if (role === "user" && isDocTeamMember(user)) return <DocDashboard />;
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
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "hr", "superadmin", "overall_admin"]}>
                <WorkUnitList />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-units/new"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"]}>
                <WorkUnitForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-units/:id"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "hr", "superadmin", "overall_admin"]}>
                <WorkUnitDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-units/:id/edit"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"]}>
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
              <ProtectedRoute roles={["admin", "hr_admin", "hr_user", "hr", "superadmin", "overall_admin"]}>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="leave"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"]}>
                <LeavePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="eod"
            element={
              <ProtectedRoute roles={["user", "admin", "hr_admin", "hr_user", "superadmin", "overall_admin"]}>
                <EodReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="team"
            element={
              <ProtectedRoute roles={["admin", "hr_admin", "superadmin", "overall_admin"]}>
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

          {/* Documentation Team routes */}
          <Route
            path="doc/clients"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <DocClients />
              </ProtectedRoute>
            }
          />
          <Route
            path="doc/clients/:id"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <DocClientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="doc/cases"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <DocCases />
              </ProtectedRoute>
            }
          />
          <Route
            path="doc/work-units"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <DocWorkUnits />
              </ProtectedRoute>
            }
          />
          <Route
            path="doc/documents"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <DocDocuments />
              </ProtectedRoute>
            }
          />
          <Route
            path="doc/documents/new"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <DocUploadForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="doc/checklist/:clientId"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <DocChecklist />
              </ProtectedRoute>
            }
          />
          <Route
            path="doc/leaderboard"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <DocLeaderboard />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
