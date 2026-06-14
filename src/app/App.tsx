import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './auth/RoleGuard';
import { LoginPage } from './auth/LoginPage';
import { PwaBackGuard } from './navigation/PwaBackGuard';
import { PublicLayout } from './public/PublicLayout';
import { ActionHubPage } from './public/ActionHubPage';
import { OrganizationProfilePage } from './public/OrganizationProfilePage';
import { PublicInfoPage } from './public/PublicInfoPage';
import { PublicProfilePage } from './public/PublicProfilePage';
import { PublicTicketDetailPage } from './public/PublicTicketDetailPage';
import { PublicTicketsPage } from './public/PublicTicketsPage';
import { PublicStatusCheckPage } from './public/PublicStatusCheckPage';
import { CustomerDashboardPage } from './public/CustomerDashboardPage';
import { WasteSummaryPage } from './public/WasteSummaryPage';
import { LoadingState } from './ui/components';

const NewPickupPage = lazy(() =>
  import('./public/NewPickupPage').then((module) => ({
    default: module.NewPickupPage,
  })),
);
const PublicHomePage = lazy(() =>
  import('./public/PublicHomePage').then((module) => ({
    default: module.PublicHomePage,
  })),
);
const AdminMapPage = lazy(() =>
  import('./admin/AdminMapPage').then((module) => ({
    default: module.AdminMapPage,
  })),
);
const AdminLayout = lazy(() =>
  import('./admin/AdminLayout').then((module) => ({
    default: module.AdminLayout,
  })),
);
const AdminOverview = lazy(() =>
  import('./admin/AdminOverview').then((module) => ({
    default: module.AdminOverview,
  })),
);
const ReportsPage = lazy(() =>
  import('./admin/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
);
const SchedulesPage = lazy(() =>
  import('./admin/SchedulesPage').then((module) => ({
    default: module.SchedulesPage,
  })),
);
const TicketDetailPage = lazy(() =>
  import('./admin/TicketDetailPage').then((module) => ({
    default: module.TicketDetailPage,
  })),
);
const TicketsPage = lazy(() =>
  import('./admin/TicketsPage').then((module) => ({
    default: module.TicketsPage,
  })),
);
const DriverManagementPage = lazy(() =>
  import('./admin/DriverManagementPage').then((module) => ({
    default: module.DriverManagementPage,
  })),
);
const ManualPickupPage = lazy(() =>
  import('./admin/ManualPickupPage').then((module) => ({
    default: module.ManualPickupPage,
  })),
);
const RegionManagementPage = lazy(() =>
  import('./admin/RegionManagementPage').then((module) => ({
    default: module.RegionManagementPage,
  })),
);
const DriverLayout = lazy(() =>
  import('./driver/DriverLayout').then((module) => ({
    default: module.DriverLayout,
  })),
);
const DriverPickupDetailPage = lazy(() =>
  import('./driver/DriverPickupDetailPage').then((module) => ({
    default: module.DriverPickupDetailPage,
  })),
);
const DriverPickupsPage = lazy(() =>
  import('./driver/DriverPickupsPage').then((module) => ({
    default: module.DriverPickupsPage,
  })),
);

export function App() {
  return (
    <>
      <PwaBackGuard />
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingState label="Memuat halaman..." />}>
              <PublicHomePage />
            </Suspense>
          }
        />
        <Route path="/layanan" element={<PublicInfoPage page="services" />} />
        <Route
          path="/layanan-profesional"
          element={<PublicInfoPage page="professional" />}
        />
        <Route path="/program" element={<PublicInfoPage page="programs" />} />
        <Route path="/wilayah" element={<PublicInfoPage page="regions" />} />
        <Route path="/dampak" element={<PublicInfoPage page="impact" />} />
        <Route path="/mitra" element={<PublicInfoPage page="partners" />} />
        <Route path="/bantuan" element={<PublicInfoPage page="help" />} />
        <Route element={<PublicLayout />}>
          <Route path="/app" element={<ActionHubPage />} />
          <Route path="/profil" element={<OrganizationProfilePage />} />
          <Route path="/sampahku" element={<WasteSummaryPage />} />
          <Route path="/tickets" element={<PublicTicketsPage />} />
          <Route path="/tickets/check" element={<PublicStatusCheckPage />} />
          <Route path="/tickets/:id" element={<PublicTicketDetailPage />} />
          <Route path="/profile" element={<PublicProfilePage />} />
        </Route>
        <Route
          path="/pickup/new"
          element={
            <Suspense fallback={<LoadingState label="Memuat peta lokasi..." />}>
              <NewPickupPage />
            </Suspense>
          }
        />
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/auth/staff" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/warga/dashboard"
          element={
            <RoleGuard roles={['CUSTOMER']}>
              <PublicLayout />
            </RoleGuard>
          }
        >
          <Route index element={<CustomerDashboardPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <RoleGuard roles={['SUPER_ADMIN', 'OPERATOR']}>
              <Suspense fallback={<LoadingState label="Memuat dashboard..." />}>
                <AdminLayout />
              </Suspense>
            </RoleGuard>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/new" element={<ManualPickupPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="drivers" element={<DriverManagementPage />} />
          <Route
            path="map"
            element={
              <Suspense fallback={<LoadingState label="Memuat peta..." />}>
                <AdminMapPage />
              </Suspense>
            }
          />
          <Route path="regions" element={<RegionManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route
          path="/driver"
          element={
            <RoleGuard roles={['DRIVER']}>
              <Suspense fallback={<LoadingState label="Memuat tugas..." />}>
                <DriverLayout />
              </Suspense>
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="pickups" replace />} />
          <Route path="pickups" element={<DriverPickupsPage />} />
          <Route path="pickups/:id" element={<DriverPickupDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </>
  );
}
