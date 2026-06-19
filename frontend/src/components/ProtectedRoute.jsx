// frontend/src/components/ProtectedRoute.jsx

import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Protected Route Wrapper Component
 * Intercepts router transitions and ensures the client has a valid session token.
 * If not authenticated, redirects automatically to the /login path.
 */
const ProtectedRoute = () => {
  const { token, loading } = useContext(AuthContext);

  // 1. Show a loading screen while AuthContext verifies the JWT token on page reload
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        {/* Simple spinning CSS loading circle */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // 2. If token exists, render child routes inside the parent shell (<Outlet />).
  // Otherwise, force redirect to /login and replace the history stack to block "back" navigation.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
