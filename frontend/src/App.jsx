import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import LiveAlertToast from './components/LiveAlertToast';
import RoleRoute from './components/RoleRoute';

import Login from './pages/Login';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import ChefKDS from './pages/chef/ChefKDS';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Layout wrapper for authenticated dashboards
const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <LiveAlertToast />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

// Default index redirect based on user role
const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Waiter Floor View */}
            <Route
              path="/waiter"
              element={
                <RoleRoute allowedRoles={['waiter', 'admin', 'owner']}>
                  <DashboardLayout>
                    <WaiterDashboard />
                  </DashboardLayout>
                </RoleRoute>
              }
            />

            {/* Chef Kitchen Display System (KDS) */}
            <Route
              path="/chef"
              element={
                <RoleRoute allowedRoles={['chef', 'admin', 'owner']}>
                  <DashboardLayout>
                    <ChefKDS />
                  </DashboardLayout>
                </RoleRoute>
              }
            />

            {/* Owner Analytics & Sales Reports */}
            <Route
              path="/owner"
              element={
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <DashboardLayout>
                    <OwnerDashboard />
                  </DashboardLayout>
                </RoleRoute>
              }
            />

            {/* Admin Management & System Audit */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </RoleRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
