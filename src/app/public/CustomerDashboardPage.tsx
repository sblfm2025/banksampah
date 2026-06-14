import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { AppHeader, Card } from '../ui/components';
import { PublicTicketsPage } from './PublicTicketsPage';

export function CustomerDashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <AppHeader
        subtitle={`Halo, ${user?.name ?? 'Warga'}`}
        title="Dashboard Warga"
      />
      <main className="app-container pt-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardLink
            description="Mulai dari foto dan lokasi."
            label="Ajukan Jemput"
            to="/pickup/new"
          />
          <DashboardLink
            description="Perbarui kontak dan alamat."
            label="Alamat & Profil"
            to="/profile"
          />
          <DashboardLink
            description="Kembali ke pusat aksi cepat."
            label="Pusat Layanan"
            to="/app"
          />
        </div>
      </main>
      <PublicTicketsPage embedded />
    </>
  );
}

function DashboardLink({
  description,
  label,
  to,
}: {
  description: string;
  label: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="h-full p-5 transition hover:-translate-y-0.5">
        <h2 className="font-extrabold text-[#087f8c]">{label}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </Card>
    </Link>
  );
}
