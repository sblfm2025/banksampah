import { createContext, useContext } from 'react';
import type { AppUser } from '../../shared/schemas/user.schema';

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  authenticated: boolean;
  profileMissing: boolean;
  authUid: string | null;
  authEmail: string | null;
  authDisplayName: string | null;
  isGoogleUser: boolean;
  login(email: string, password: string): Promise<void>;
  loginWithWhatsApp(phoneNumber: string, password: string): Promise<void>;
  loginWithGoogle(): Promise<void>;
  refreshProfile(): Promise<void>;
  logout(): Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus berada di dalam AuthProvider.');
  return context;
}
