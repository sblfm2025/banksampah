import { Navigate } from 'react-router-dom';
import { useAuth } from './auth/auth-context';

export function HomeRedirect() {
  const { user, loading, authenticated } = useAuth();
  if (loading) return null;
  if (!authenticated) return <Navigate replace to="/auth" />;
  return (
    <Navigate
      replace
      to={user?.role === 'DRIVER' ? '/driver/pickups' : '/admin'}
    />
  );
}
