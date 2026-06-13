import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';

const navigation = [
  { to: '/admin', label: 'Ringkasan', end: true },
  { to: '/admin/tickets', label: 'Tiket Masuk' },
  { to: '/admin/schedules', label: 'Jadwal' },
  { to: '/admin/drivers', label: 'Petugas' },
  { to: '/admin/reports', label: 'Laporan' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const demoMode = import.meta.env.VITE_USE_DEMO_DATA !== 'false';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-green-950/20 bg-green-800 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-200">
              SampahTa' Pinrang
            </p>
            <p className="mt-1 font-bold">Dashboard Operator</p>
          </div>
          <div className="flex items-center gap-4 text-right text-sm">
            <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-green-200">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator'}
            </p>
            </div>
            {!demoMode && (
              <button
                className="rounded-lg border border-green-300 px-3 py-2 font-semibold"
                onClick={() => void logout()}
                type="button"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
        <nav
          aria-label="Navigasi admin"
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${
                  isActive
                    ? 'border-white text-white'
                    : 'border-transparent text-green-100 hover:text-white'
                }`
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {demoMode && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900">
          Mode demo aktif. Perubahan hanya tersimpan selama halaman dibuka.
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
