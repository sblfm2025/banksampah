import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppUser } from '../../shared/schemas/user.schema';
import { AuthContext, type AuthState } from './auth-context';

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
  const demoMode = import.meta.env.VITE_USE_DEMO_DATA !== 'false';
  const [state, setState] = useState<AuthState>({
    user: demoMode ? getDemoUser() : null,
    loading: !demoMode,
    authenticated: demoMode,
    profileMissing: false,
    authUid: demoMode ? getDemoUser().id : null,
    login: async () => {},
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
