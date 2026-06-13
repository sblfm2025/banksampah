import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppLogo, ErrorState, PrimaryButton } from '../ui/components';
import { useAuth } from './auth-context';

export function LoginPage() {
  const {
    authenticated,
    authUid,
    loading,
    login,
    logout,
    profileMissing,
    user,
  } = useAuth();
  const [error, setError] = useState('');

  if (user) {
    return (
      <Navigate
        replace
        to={user.role === 'DRIVER' ? '/driver/pickups' : '/admin'}
      />
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get('email')), String(data.get('password')));
    } catch {
      setError('Email atau password tidak valid.');
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="brand-grid hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <AppLogo inverse />
        <div className="max-w-lg">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
            Portal operasional
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight">
            Jemput sampah lebih tertata untuk Pinrang.
          </h1>
          <p className="mt-5 leading-8 text-cyan-50">
            Verifikasi permintaan, atur jadwal, dan bantu petugas
            menyelesaikan penjemputan dari satu dashboard.
          </p>
        </div>
        <p className="text-xs text-cyan-100">
          Yayasan Masyarakat Peduli Pinrang
        </p>
      </section>
      <section className="grid place-items-center bg-[#f8fafc] px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <AppLogo />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
            Selamat datang
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Masuk ke akun</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Gunakan akun operator atau petugas yang terdaftar.
          </p>

          {profileMissing && authenticated && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Login berhasil, tetapi profil dan role akun belum dibuat.
              {authUid && (
                <code className="mt-3 block break-all rounded-xl bg-white p-3 text-xs">
                  users/{authUid}
                </code>
              )}
              <button
                className="mt-3 font-bold underline"
                onClick={() => void logout()}
                type="button"
              >
                Keluar dan gunakan akun lain
              </button>
            </div>
          )}
          {error && <div className="mt-5"><ErrorState message={error} /></div>}

          <form
            className="mt-7 space-y-4"
            hidden={profileMissing && authenticated}
            onSubmit={submit}
          >
            <Field autoComplete="email" label="Email" name="email" type="email" />
            <Field
              autoComplete="current-password"
              label="Password"
              name="password"
              type="password"
            />
            <PrimaryButton className="mt-2 w-full" disabled={loading} type="submit">
              {loading ? 'Memeriksa akun...' : 'Masuk'}
            </PrimaryButton>
          </form>
          <Link
            className="mt-6 block text-center text-sm font-bold text-[#087f8c]"
            to="/"
          >
            ← Kembali ke halaman warga
          </Link>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-[#d9e2e7] bg-white p-3.5 outline-none focus:border-[#159fb3]"
        minLength={props.type === 'password' ? 6 : undefined}
        required
        {...props}
      />
    </label>
  );
}
