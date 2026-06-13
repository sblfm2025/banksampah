import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isCustomerProfileComplete } from '../../shared/schemas/user.schema';
import { LoadingState } from '../ui/components';
import { useAuth } from './auth-context';

export function CustomerProfileGuard({ children }: { children: ReactNode }) {
  const { authenticated, isGoogleUser, loading, profileMissing, user } =
    useAuth();

  if (loading) return <LoadingState label="Memeriksa profil..." />;
  if (
    authenticated &&
    isGoogleUser &&
    (profileMissing ||
      (user?.role === 'CUSTOMER' && !isCustomerProfileComplete(user)))
  ) {
    return <Navigate replace to="/profile?onboarding=1" />;
  }
  return children;
}
