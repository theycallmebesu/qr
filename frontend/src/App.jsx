import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Login from './pages/Login';
import WaiterView from './pages/waiter/WaiterView';
import KitchenView from './pages/kitchen/KitchenView';
import ReceptionView from './pages/reception/ReceptionView';
import AdminView from './pages/admin/AdminView';

// Route Guard Component
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-bold text-sm">
        Authenticating station...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin has superuser access to all stations
  if (user.role === 'admin') {
    return children;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

// Root redirector based on authenticated user's role
const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-bold text-sm">
        Loading restaurant station...
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
            {/* Staff Authentication */}
            <Route path="/login" element={<Login />} />

            {/* Waiter Station */}
            <Route
              path="/waiter"
              element={
                <ProtectedRoute allowedRoles={['waiter', 'admin']}>
                  <WaiterView />
                </ProtectedRoute>
              }
            />

            {/* Kitchen KDS Station */}
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
                  <KitchenView />
                </ProtectedRoute>
              }
            />

            {/* Receptionist & Billing Station */}
            <Route
              path="/reception"
              element={
                <ProtectedRoute allowedRoles={['reception', 'admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />

            {/* Admin Station */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminView />
                </ProtectedRoute>
              }
            />

            {/* Root / Default Redirect */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
