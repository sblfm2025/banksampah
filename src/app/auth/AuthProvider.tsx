import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppUser } from '../../shared/schemas/user.schema';
import { AuthContext, type AuthState } from './auth-context';
import { useDemoData } from '../runtime-config';

function getDemoUser(): AppUser {
  const role =
    import.meta.env.VITE_DEMO_ROLE === 'DRIVER' ? 'DRIVER' : 'OPERATOR';
  return role === 'DRIVER'
    ? {
        id: 'driver-1',
        name: 'Pak Amir',
        email: 'driver@sampahta.local',
        role,
        isActive: true,
      }
    : {
        id: 'demo-operator',
        name: 'Operator Demo',
        email: 'operator@sampahta.local',
        role,
        isActive: true,
      };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoMode = useDemoData;
  const [state, setState] = useState<AuthState>({
    user: demoMode ? getDemoUser() : null,
    loading: !demoMode,
    authenticated: demoMode,
    profileMissing: false,
    authUid: demoMode ? getDemoUser().id : null,
    authEmail: demoMode ? getDemoUser().email ?? null : null,
    authDisplayName: demoMode ? getDemoUser().name : null,
    isGoogleUser: false,
    login: async () => {},
    loginWithWhatsApp: async () => {},
    loginWithGoogle: async () => {},
    refreshProfile: async () => {},
    logout: async () => {},
  });

  useEffect(() => {
    if (demoMode) return;

    let unsubscribe = () => {};
    let active = true;

    void import('../../client/firebase').then(
      async ({ auth, getAppUser, onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!active) return;
          if (!firebaseUser) {
            setState((current) => ({
              ...current,
              user: null,
              loading: false,
              authenticated: false,
              profileMissing: false,
              authUid: null,
              authEmail: null,
              authDisplayName: null,
              isGoogleUser: false,
            }));
            return;
          }
          try {
            const user = await getAppUser(firebaseUser.uid);
            if (active) {
              setState((current) => ({
                ...current,
                user,
                loading: false,
                authenticated: true,
                profileMissing: !user,
                authUid: firebaseUser.uid,
                authEmail: firebaseUser.email,
                authDisplayName: firebaseUser.displayName,
                isGoogleUser: firebaseUser.providerData.some(
                  (provider) => provider.providerId === 'google.com',
                ),
              }));
            }
          } catch {
            if (active) {
              setState((current) => ({
                ...current,
                user: null,
                loading: false,
                authenticated: true,
                profileMissing: true,
                authUid: firebaseUser.uid,
                authEmail: firebaseUser.email,
                authDisplayName: firebaseUser.displayName,
                isGoogleUser: firebaseUser.providerData.some(
                  (provider) => provider.providerId === 'google.com',
                ),
              }));
            }
          }
        });
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [demoMode]);

  const value = useMemo<AuthState>(
    () => ({
      ...state,
      login: async (email, password) => {
        if (demoMode) return;
        const { loginWithEmail } = await import('../../client/firebase');
        setState((current) => ({ ...current, loading: true }));
        try {
          await loginWithEmail(email, password);
        } catch (error) {
          setState((current) => ({ ...current, loading: false }));
          throw error;
        }
      },
      loginWithWhatsApp: async (phoneNumber, password) => {
        if (demoMode) return;
        const { loginWithWhatsAppNumber } = await import('../../client/firebase');
        setState((current) => ({ ...current, loading: true }));
        try {
          await loginWithWhatsAppNumber(phoneNumber, password);
        } catch (error) {
          setState((current) => ({ ...current, loading: false }));
          throw error;
        }
      },
      loginWithGoogle: async () => {
        if (demoMode) return;
        const { loginWithGoogle } = await import('../../client/firebase');
        setState((current) => ({ ...current, loading: true }));
        try {
          await loginWithGoogle();
        } catch (error) {
          setState((current) => ({ ...current, loading: false }));
          throw error;
        }
      },
      refreshProfile: async () => {
        if (demoMode || !state.authUid) return;
        const { getAppUser } = await import('../../client/firebase');
        const user = await getAppUser(state.authUid);
        setState((current) => ({
          ...current,
          user,
          profileMissing: !user,
        }));
      },
      logout: async () => {
        if (demoMode) return;
        const { logout } = await import('../../client/firebase');
        await logout();
      },
    }),
    [demoMode, state],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
