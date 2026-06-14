import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { AppUser } from '../../shared/schemas/user.schema';
import { useAuth } from './auth-context';

export function RoleGuard({
  roles,
  children,
}: {
  roles: AppUser['role'][];
  children: ReactNode;
}) {
  const { user, loading, authenticated, profileMissing } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
        Memeriksa akses...
      </div>
    );
  }

  if (!authenticated) return <Navigate replace to="/auth" />;

  if (!user || profileMissing || !user.isActive || !roles.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Akses ditolak</h1>
          <p className="mt-3 text-slate-600">
            {profileMissing
              ? 'Akun sudah login, tetapi profil dan role belum dikonfigurasi.'
              : 'Akun ini tidak memiliki akses ke halaman tersebut.'}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
