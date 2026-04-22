import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { refreshAuth } from "./store/authSlice.js";
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
import AuditLog from "./pages/Audit/AuditLog.jsx";
import EodReport from "./pages/Eod/EodReport.jsx";
import OrgSettings from "./pages/Settings/OrgSettings.jsx";
import WebhookLogs from "./pages/Webhooks/WebhookLogs.jsx";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useSelector((s) => s.auth);
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useSelector((s) => s.auth);
  if (!user) return null;
  if (user.role === "superadmin") return <CeoDashboard />;
  if (user.role === "admin") return <AdminDashboard />;
  return <UserDashboard />;
}

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(refreshAuth());
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
          <Route path="work-units" element={<WorkUnitList />} />
          <Route path="work-units/new" element={<WorkUnitForm />} />
          <Route path="work-units/:id" element={<WorkUnitDetail />} />
          <Route path="work-units/:id/edit" element={<WorkUnitForm />} />
          <Route path="cases" element={<CaseBoard />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          <Route path="kpi" element={<KpiPage />} />
          <Route
            path="leaderboard"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route path="reports" element={<Reports />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="eod" element={<EodReport />} />
          <Route
            path="team"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
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
              <ProtectedRoute roles={["superadmin"]}>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
