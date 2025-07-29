import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  timeout?: number; // in milliseconds
}

export const ProtectedRoute = ({ 
  children, 
  redirectTo = '/auth',
  timeout = 10000 // 10 seconds
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, timeout);

      return () => clearTimeout(timer);
    } else {
      setTimeoutReached(false);
    }
  }, [loading, timeout]);

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (timeoutReached && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">Authentication timeout</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}; 