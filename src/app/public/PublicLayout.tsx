import { Outlet } from 'react-router-dom';
import { BottomNav } from '../ui/components';

export function PublicLayout() {
  return (
    <div className="app-shell safe-bottom">
      <Outlet />
      <BottomNav />
    </div>
  );
}
