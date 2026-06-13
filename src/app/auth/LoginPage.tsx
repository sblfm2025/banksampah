import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { isCustomerProfileComplete } from '../../shared/schemas/user.schema';
import { AppLogo, ErrorState, PrimaryButton } from '../ui/components';
import { useAuth } from './auth-context';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const requestedNext = searchParams.get('next');
  const customerDestination =
    requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/';
  const {
    authenticated,
    authUid,
    loading,
    login,
    loginWithGoogle,
    logout,
    profileMissing,
    isGoogleUser,
    user,
  } = useAuth();
  const [error, setError] = useState('');

  if (user) {
    if (user.role === 'CUSTOMER') {
      return (
        <Navigate
          replace
          to={
            isCustomerProfileComplete(user)
              ? customerDestination
              : `/profile?onboarding=1&next=${encodeURIComponent(customerDestination)}`
          }
        />
      );
    }
    return (
      <Navigate
        replace
        to={user.role === 'DRIVER' ? '/driver/pickups' : '/admin'}
      />
    );
  }
  if (authenticated && profileMissing && isGoogleUser) {
    return (
      <Navigate
        replace
        to={`/profile?onboarding=1&next=${encodeURIComponent(customerDestination)}`}
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

  async function googleLogin() {
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      setError(
        'Login Google belum berhasil. Pastikan popup diizinkan dan akun Google aktif.',
      );
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
            Warga dapat masuk dengan Google. Operator dan petugas menggunakan
            email serta password yang terdaftar.
          </p>

          <button
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            disabled={loading}
            onClick={() => void googleLogin()}
            type="button"
          >
            <GoogleMark />
            Lanjutkan dengan Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Akun petugas
            <span className="h-px flex-1 bg-slate-200" />
          </div>

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
            className="space-y-4"
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

function GoogleMark() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.5 14.1a6 6 0 0 1 0-4.2V7.3H3.2a10 10 0 0 0 0 9.4l3.3-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 7.3l3.3 2.6a5.8 5.8 0 0 1 5.5-4Z"
        fill="#EA4335"
      />
    </svg>
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
