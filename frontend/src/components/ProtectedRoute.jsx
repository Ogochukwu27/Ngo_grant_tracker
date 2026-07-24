// frontend/src/components/ProtectedRoute.jsx

import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Protected Route Wrapper Component
 * Intercepts router transitions and ensures the client has a valid session token.
 * If not authenticated, redirects automatically to the /login path.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { token, loading, user } = useContext(AuthContext);

  // 1. Show a loading screen while AuthContext verifies the JWT token on page reload
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-55 dark:bg-slate-900">
        {/* Simple spinning CSS loading circle */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // 2. If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. If allowedRoles is defined, ensure the user has the required permission role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Authorized, render nested routes
  return <Outlet />;
};

export default ProtectedRoute;
