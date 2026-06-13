import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { AdminOverview } from './admin/AdminOverview';
import { ReportsPage } from './admin/ReportsPage';
import { SchedulesPage } from './admin/SchedulesPage';
import { TicketDetailPage } from './admin/TicketDetailPage';
import { TicketsPage } from './admin/TicketsPage';
import { DriverManagementPage } from './admin/DriverManagementPage';
import { RegionManagementPage } from './admin/RegionManagementPage';
import { RoleGuard } from './auth/RoleGuard';
import { LoginPage } from './auth/LoginPage';
import { CustomerProfileGuard } from './auth/CustomerProfileGuard';
import { DriverLayout } from './driver/DriverLayout';
import { DriverPickupDetailPage } from './driver/DriverPickupDetailPage';
import { DriverPickupsPage } from './driver/DriverPickupsPage';
import { PublicLayout } from './public/PublicLayout';
import { PublicHomePage } from './public/PublicHomePage';
import { OrganizationProfilePage } from './public/OrganizationProfilePage';
import { PublicProfilePage } from './public/PublicProfilePage';
import { PublicTicketDetailPage } from './public/PublicTicketDetailPage';
import { PublicTicketsPage } from './public/PublicTicketsPage';
import { WasteSummaryPage } from './public/WasteSummaryPage';
import { LoadingState } from './ui/components';

const NewPickupPage = lazy(() =>
  import('./public/NewPickupPage').then((module) => ({
    default: module.NewPickupPage,
  })),
);
const AdminMapPage = lazy(() =>
  import('./admin/AdminMapPage').then((module) => ({
    default: module.AdminMapPage,
  })),
);

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/profil" element={<OrganizationProfilePage />} />
        <Route path="/sampahku" element={<WasteSummaryPage />} />
        <Route path="/tickets" element={<PublicTicketsPage />} />
        <Route path="/tickets/:id" element={<PublicTicketDetailPage />} />
        <Route path="/profile" element={<PublicProfilePage />} />
      </Route>
      <Route
        path="/pickup/new"
        element={
          <CustomerProfileGuard>
            <Suspense fallback={<LoadingState label="Memuat peta lokasi..." />}>
              <NewPickupPage />
            </Suspense>
          </CustomerProfileGuard>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RoleGuard roles={['SUPER_ADMIN', 'OPERATOR']}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="tickets" element={<TicketsPage />} />
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
            <DriverLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="pickups" replace />} />
        <Route path="pickups" element={<DriverPickupsPage />} />
        <Route path="pickups/:id" element={<DriverPickupDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
