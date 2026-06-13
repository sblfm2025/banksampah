import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import {
  listPendingCompletions,
  syncPendingCompletions,
} from './driver-offline';
import { driverRepository } from './driver.repository';

export function DriverLayout() {
  const { user, logout } = useAuth();
  const demoMode = import.meta.env.VITE_USE_DEMO_DATA !== 'false';
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    setPending((await listPendingCompletions()).length);
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      await syncPendingCompletions(driverRepository);
      await refreshPending();
      await queryClient.invalidateQueries({ queryKey: ['driver-pickups'] });
    } finally {
      setSyncing(false);
    }
  }, [queryClient, refreshPending, syncing]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshPending(), 0);
    const onOnline = () => {
      setOnline(true);
      void sync();
    };
    const onOffline = () => setOnline(false);
    const onQueueChanged = () => void refreshPending();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('driver-queue-changed', onQueueChanged);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('driver-queue-changed', onQueueChanged);
    };
  }, [refreshPending, sync]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-10 bg-green-800 text-white shadow">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-200">
              SampahTa' Driver
            </p>
            <p className="mt-1 font-bold">{user?.name}</p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
            <p
              className={`text-sm font-bold ${online ? 'text-green-100' : 'text-amber-200'}`}
            >
              {online ? 'Online' : 'Offline'}
            </p>
            {pending > 0 && (
              <button
                className="mt-1 text-xs font-semibold text-amber-200 underline"
                disabled={syncing || !online}
                onClick={() => void sync()}
                type="button"
              >
                {syncing ? 'Sinkronisasi...' : `${pending} pending`}
              </button>
            )}
            </div>
            {!demoMode && (
              <button
                className="rounded-lg border border-green-300 px-3 py-2 text-xs font-bold"
                onClick={() => void logout()}
                type="button"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
      </header>
      {demoMode && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          Mode demo driver aktif
        </div>
      )}
      <main className="mx-auto max-w-2xl px-4 py-5">
        <Outlet context={{ refreshPending }} />
      </main>
    </div>
  );
}
