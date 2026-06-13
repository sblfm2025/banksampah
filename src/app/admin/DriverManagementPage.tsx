import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { appUserSchema, type AppUser } from '../../shared/schemas/user.schema';
import { useAuth } from '../auth/auth-context';

const demoDrivers: AppUser[] = [
  {
    id: 'driver-1',
    name: 'Pak Amir',
    email: 'driver@sampahta.local',
    phoneNumber: '628123456789',
    role: 'DRIVER',
    isActive: true,
  },
];

async function listDrivers() {
  if (import.meta.env.VITE_USE_DEMO_DATA !== 'false') return demoDrivers;
  const [{ collection, getDocs, query, where }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('../../client/firebase'),
  ]);
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'DRIVER')),
  );
  return snapshot.docs
    .map((item) => appUserSchema.parse({ id: item.id, ...item.data() }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
}

async function saveDriver(driver: AppUser) {
  if (import.meta.env.VITE_USE_DEMO_DATA !== 'false') return driver;
  const parsed = appUserSchema.parse(driver);
  const [{ doc, setDoc }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('../../client/firebase'),
  ]);
  const { id, ...profile } = parsed;
  await setDoc(doc(db, 'users', id), {
    name: profile.name,
    email: profile.email,
    role: profile.role,
    isActive: profile.isActive,
    ...(profile.phoneNumber ? { phoneNumber: profile.phoneNumber } : {}),
  });
  return parsed;
}

async function setDriverActive(driver: AppUser, isActive: boolean) {
  return saveDriver({ ...driver, isActive });
}

export function DriverManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const drivers = useQuery({
    queryKey: ['driver-profiles'],
    queryFn: listDrivers,
  });
  const save = useMutation({
    mutationFn: saveDriver,
    onSuccess: async () => {
      setMessage('Profil petugas berhasil disimpan.');
      await queryClient.invalidateQueries({ queryKey: ['driver-profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
  const toggle = useMutation({
    mutationFn: ({
      driver,
      isActive,
    }: {
      driver: AppUser;
      isActive: boolean;
    }) => setDriverActive(driver, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['driver-profiles'] });
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
  const canManage = user?.role === 'SUPER_ADMIN';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const form = event.currentTarget;
    const data = new FormData(form);
    save.mutate(
      {
        id: String(data.get('uid')).trim(),
        name: String(data.get('name')).trim(),
        email: String(data.get('email')).trim(),
        phoneNumber: String(data.get('phoneNumber')).trim() || undefined,
        role: 'DRIVER',
        isActive: true,
      },
      { onSuccess: () => form.reset() },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Petugas</h1>
        <p className="mt-2 text-slate-600">
          Profil di sini harus memakai UID yang sama dengan akun Firebase
          Authentication.
        </p>
      </div>

      {(save.error || toggle.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {(save.error ?? toggle.error)?.message}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          {message}
        </div>
      )}

      {canManage && (
        <form
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
          onSubmit={submit}
        >
          <h2 className="md:col-span-2 text-lg font-bold">
            Tambah Profil Petugas
          </h2>
          <Field label="UID Firebase Auth" name="uid" required />
          <Field label="Nama petugas" name="name" required />
          <Field label="Email akun" name="email" required type="email" />
          <Field label="Nomor WhatsApp" name="phoneNumber" />
          <button
            className="rounded-xl bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50 md:col-span-2"
            disabled={save.isPending}
            type="submit"
          >
            {save.isPending ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      )}

      {!canManage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          Operator dapat melihat petugas. Penambahan dan perubahan akun hanya
          tersedia untuk Super Admin.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-bold">Daftar Petugas</h2>
        </div>
        {drivers.isLoading ? (
          <p className="p-5 text-slate-500">Memuat petugas...</p>
        ) : drivers.data?.length ? (
          <div className="divide-y divide-slate-200">
            {drivers.data.map((driver) => (
              <div
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                key={driver.id}
              >
                <div>
                  <p className="font-bold">{driver.name}</p>
                  <p className="text-sm text-slate-600">{driver.email}</p>
                  <p className="mt-1 break-all text-xs text-slate-400">
                    UID: {driver.id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      driver.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {driver.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {canManage && (
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
                      disabled={toggle.isPending}
                      onClick={() =>
                        toggle.mutate({
                          driver,
                          isActive: !driver.isActive,
                        })
                      }
                      type="button"
                    >
                      {driver.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-slate-500">Belum ada profil petugas.</p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  required = false,
  type = 'text',
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}
