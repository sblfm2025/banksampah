import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { AdminOverview } from './admin/AdminOverview';
import { ReportsPage } from './admin/ReportsPage';
import { SchedulesPage } from './admin/SchedulesPage';
import { TicketDetailPage } from './admin/TicketDetailPage';
import { TicketsPage } from './admin/TicketsPage';
import { DriverManagementPage } from './admin/DriverManagementPage';
import { RoleGuard } from './auth/RoleGuard';
import { LoginPage } from './auth/LoginPage';
import { DriverLayout } from './driver/DriverLayout';
import { DriverPickupDetailPage } from './driver/DriverPickupDetailPage';
import { DriverPickupsPage } from './driver/DriverPickupsPage';
import { HomeRedirect } from './HomeRedirect';

export function App() {
  return (
    <Routes>
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
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
