import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const userInfoString = localStorage.getItem('userInfo');
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

  if (!userInfo || !userInfo.token) {
    // User not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
    // User authenticated but not authorized, redirect to a forbidden page or dashboard
    return <Navigate to="/" replace />; // Redirect to dashboard for unauthorized access
  }

  return <Outlet />;
};

export default ProtectedRoute;
