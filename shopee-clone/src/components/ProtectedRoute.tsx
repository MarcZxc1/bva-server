import React, { ReactNode, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'BUYER' | 'SELLER' | 'ADMIN';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = React.memo(({ 
  children, 
  requiredRole,
  redirectTo 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const shouldRedirect = useMemo(() => {
    if (isLoading) return false;
    if (!isAuthenticated) return true;
    if (requiredRole && user?.role !== requiredRole) return true;
    return false;
  }, [isLoading, isAuthenticated, requiredRole, user?.role]);

  const redirectPath = useMemo(() => {
    if (requiredRole === 'SELLER') {
      return redirectTo || '/login';
    }
    return redirectTo || '/buyer-login';
  }, [requiredRole, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  if (shouldRedirect) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

