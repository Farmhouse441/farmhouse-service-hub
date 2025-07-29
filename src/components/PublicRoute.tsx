import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute = ({ children, redirectTo = '/dashboard' }: PublicRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}; 