import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { AppIcon, AppLogo } from '../ui/components';

const navigation = [
  { to: '/admin', label: 'Dashboard', icon: 'chart', end: true },
  { to: '/admin/tickets', label: 'Tiket Masuk', icon: 'ticket' },
  { to: '/admin/schedules', label: 'Jadwal Jemput', icon: 'calendar' },
  { to: '/admin/map', label: 'Peta', icon: 'pin' },
  { to: '/admin/regions', label: 'Wilayah', icon: 'leaf' },
  { to: '/admin/drivers', label: 'Petugas', icon: 'user' },
  { to: '/admin/reports', label: 'Laporan', icon: 'spark' },
] satisfies ReadonlyArray<{
  to: string;
  label: string;
  icon: 'chart' | 'ticket' | 'calendar' | 'pin' | 'leaf' | 'user' | 'spark';
  end?: boolean;
}>;

export function AdminLayout() {
  const { user, logout } = useAuth();
  const demoMode = import.meta.env.VITE_USE_DEMO_DATA !== 'false';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950 lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden min-h-screen bg-gradient-to-b from-[#087f8c] to-[#075e68] p-5 text-white lg:sticky lg:top-0 lg:block lg:h-screen">
        <AppLogo inverse />
        <nav className="mt-10 space-y-2" aria-label="Navigasi admin">
          {navigation.map((item) => (
            <AdminLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-2xl bg-white/10 p-4">
          <p className="font-bold">{user?.name}</p>
          <p className="mt-1 text-xs text-cyan-100">
            {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator'}
          </p>
          {!demoMode && (
            <button
              className="mt-4 w-full rounded-xl border border-white/40 px-3 py-2 text-sm font-bold"
              onClick={() => void logout()}
              type="button"
            >
              Keluar
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <AppLogo compact />
            <div className="text-right text-xs">
              <p className="font-bold">{user?.name}</p>
              <p className="text-slate-500">
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Operator'}
              </p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3" aria-label="Navigasi admin">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 px-3 py-3 text-xs font-bold ${
                    isActive
                      ? 'border-[#159fb3] text-[#087f8c]'
                      : 'border-transparent text-slate-500'
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
        <main className="mx-auto max-w-[96rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminLink({
  to,
  label,
  icon,
  end,
}: (typeof navigation)[number]) {
  return (
    <NavLink
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isActive
            ? 'bg-white text-[#087f8c] shadow-lg'
            : 'text-cyan-50 hover:bg-white/10'
        }`
      }
      end={end}
      to={to}
    >
      <AppIcon name={icon} />
      {label}
    </NavLink>
  );
}
