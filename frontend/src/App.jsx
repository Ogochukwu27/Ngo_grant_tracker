// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Import our Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import BeneficiaryDetail from './pages/BeneficiaryDetail';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement'; // New page component
import AuditLogs from './pages/AuditLogs';           // New page component

function App() {
  return (
    <BrowserRouter>
      {/* Wrap the entire Router inside our AuthProvider context */}
      <AuthProvider>
        <Routes>
          {/* Public Route: Login & Register portal screen */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Group: verified by the ProtectedRoute guard */}
          <Route element={<ProtectedRoute />}>
            {/* All layouts below are nested inside the Sidebar Layout shell */}
            <Route element={<Layout />}>
              {/* Dashboard main panel */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Beneficiary Registry table and filter panel */}
              <Route path="/beneficiaries" element={<Beneficiaries />} />

              {/* Beneficiary case details profile page */}
              <Route path="/beneficiaries/:id" element={<BeneficiaryDetail />} />

              {/* System alerts notification inbox */}
              <Route path="/notifications" element={<Notifications />} />

              {/* Settings page */}
              <Route path="/settings" element={<Settings />} />

              {/* Admin-only Routes: Secured with requiredRole validation */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/users" element={<UserManagement />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
              </Route>
            </Route>

            {/* Auto-redirect root path '/' to secure dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all fallback route: redirect any unknown paths to login/dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
