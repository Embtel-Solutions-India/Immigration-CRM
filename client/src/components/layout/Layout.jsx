import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Toast from '../common/Toast.jsx';

export default function Layout() {
  const sidebarOpen = useSelector(s => s.ui.sidebarOpen);
  const toast = useSelector(s => s.ui.toast);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      {toast && <Toast />}
    </div>
  );
}
