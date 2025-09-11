import { Navigate } from 'react-router-dom'
import React from 'react';
import useAuthStore from './stores/authStore';

type ProtectedRouteProp = {
  children: React.ReactElement;
  auth?: boolean;
}

const ProtectedRoute = ({ children, auth = false }: ProtectedRouteProp) => {
  const { isAuthenticated, token } = useAuthStore();
  const hasToken = !!token;

  if (!auth && !hasToken && !isAuthenticated) {
    return <Navigate to='/' />;
  }

  if (auth && hasToken && isAuthenticated) {
    return <Navigate to='/dashboard' />;
  }

  return children;
};

export default ProtectedRoute;