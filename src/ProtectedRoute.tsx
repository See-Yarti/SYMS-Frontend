import React from 'react';
import { Navigate, Outlet, NavigateProps, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';

const ProtectedRoute: React.FC<NavigateProps> = (props) => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate {...props} to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
