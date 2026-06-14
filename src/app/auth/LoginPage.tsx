import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { isCustomerProfileComplete } from '../../shared/schemas/user.schema';
import { AppLogo, ErrorState, PrimaryButton } from '../ui/components';
import { useAuth } from './auth-context';
import {
  detectIdentifierType,
  getDefaultRouteByRole,
  normalizeIndonesianWhatsApp,
  type AuthIdentifierType,
} from './auth-utils';

type AuthStep = 'identifier' | 'choice' | 'password' | 'register';

export function LoginPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const staffMode =
    location.pathname === '/auth/staff' ||
    ['operator', 'driver', 'admin'].includes(searchParams.get('role') ?? '');
  const requestedNext = searchParams.get('next');
  const customerDestination =
    requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/warga/dashboard';
  const {
    authenticated,
    authUid,
    loading,
    login,
    loginWithGoogle,
    loginWithWhatsApp,
    logout,
    profileMissing,
    registerWithEmail,
    user,
  } = useAuth();
  const [step, setStep] = useState<AuthStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] =
    useState<AuthIdentifierType>('invalid');
  const [error, setError] = useState('');
  const whatsappUrl = getWhatsAppUrl();

  if (user) {
    if (user.role === 'CUSTOMER' && !isCustomerProfileComplete(user)) {
      return (
        <Navigate
          replace
          to={`/profile?onboarding=1&next=${encodeURIComponent(customerDestination)}`}
        />
      );
    }
    return (
      <Navigate
        replace
        to={
          user.role === 'CUSTOMER'
            ? customerDestination
            : getDefaultRouteByRole(user.role)
        }
      />
    );
  }
  if (authenticated && profileMissing && !staffMode) {
    return (
      <Navigate
        replace
        to={`/profile?onboarding=1&next=${encodeURIComponent(customerDestination)}`}
      />
    );
  }

  function continueIdentifier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const type = detectIdentifierType(identifier);
    if (type === 'invalid') {
      setError(
        'Masukkan email atau nomor WhatsApp yang benar, misalnya nama@email.com atau 0812xxxx.',
      );
      return;
    }
    setIdentifierType(type);
    setIdentifier(
      type === 'whatsapp'
        ? normalizeIndonesianWhatsApp(identifier)
        : identifier.trim().toLowerCase(),
    );
    setStep(staffMode ? 'password' : 'choice');
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const password = String(new FormData(event.currentTarget).get('password'));
    try {
      if (identifierType === 'whatsapp') {
        await loginWithWhatsApp(identifier, password);
      } else {
        await login(identifier, password);
      }
    } catch {
      setError(
        staffMode
          ? 'Akun atau password tidak cocok. Hubungi admin bila akses staff belum dibuat.'
          : 'Akun atau password tidak cocok. Anda dapat mencoba lagi, daftar sebagai warga, atau lanjut tanpa akun.',
      );
    }
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password'));
    const confirmation = String(data.get('confirmation'));
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmation) {
      setError('Konfirmasi password belum sama.');
      return;
    }
    try {
      await registerWithEmail(identifier, password);
    } catch {
      setError(
        'Akun belum dapat dibuat. Email mungkin sudah terdaftar atau koneksi sedang bermasalah.',
      );
    }
  }

  async function googleLogin() {
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      setError('Login Google belum berhasil. Pastikan popup diizinkan.');
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <section className="brand-grid hidden p-12 text-white lg:flex lg:flex-col">
        <AppLogo inverse />
        <div className="my-auto max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
            {staffMode ? 'Akses operasional' : 'Akun Peduli Pinrang'}
          </p>
          <h2 className="mt-5 text-5xl font-extrabold leading-tight">
            {staffMode
              ? 'Masuk untuk melanjutkan pekerjaan layanan.'
              : 'Satu pintu masuk untuk layanan warga.'}
          </h2>
          <p className="mt-5 leading-8 text-cyan-50">
            Sistem mengenali email atau nomor WhatsApp secara otomatis. Warga
            tetap dapat mengajukan jemput tanpa akun.
          </p>
        </div>
        <p className="text-xs text-cyan-100">
          Yayasan Masyarakat Peduli Pinrang
        </p>
      </section>

      <section className="grid place-items-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgb(15_23_42/0.08)] sm:p-8">
          <div className="mb-7 lg:hidden"><AppLogo /></div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            {staffMode ? 'Khusus staff terdaftar' : 'Selamat datang'}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">
            {step === 'register'
              ? 'Daftar sebagai Warga'
              : staffMode
                ? 'Masuk Petugas / Operator'
                : 'Masuk atau Daftar'}
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-500">
            {step === 'identifier'
              ? 'Masukkan email atau nomor WhatsApp. Sistem akan menyesuaikan otomatis.'
              : step === 'register'
                ? 'Buat akun email, lalu lengkapi nama, WhatsApp, dan alamat layanan.'
                : step === 'choice'
                  ? `Pilih cara melanjutkan dengan ${identifierType === 'email' ? 'email' : 'nomor WhatsApp'} ${identifier}.`
                  : `Lanjutkan dengan ${identifierType === 'email' ? 'email' : 'nomor WhatsApp'} ${identifier}.`}
          </p>

          {profileMissing && authenticated && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Akun sudah login, tetapi profil belum lengkap.
              {authUid && <code className="mt-2 block break-all">users/{authUid}</code>}
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

          {step === 'identifier' && (
            <form className="mt-7 space-y-4" onSubmit={continueIdentifier}>
              <Field
                autoComplete="username"
                label="Email atau Nomor WhatsApp"
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="nama@email.com atau 0812..."
                value={identifier}
              />
              <PrimaryButton className="min-h-12 w-full" type="submit">
                Lanjutkan
              </PrimaryButton>
              {!staffMode && (
                <button
                  className="min-h-12 w-full text-sm font-bold text-[#087f8c]"
                  onClick={() => void googleLogin()}
                  type="button"
                >
                  Lanjutkan dengan Google
                </button>
              )}
            </form>
          )}

          {step === 'choice' && (
            <div className="mt-7 grid gap-3">
              <PrimaryButton
                className="min-h-12 w-full"
                onClick={() => setStep('password')}
                type="button"
              >
                Masuk dengan Password
              </PrimaryButton>
              {identifierType === 'email' ? (
                <button
                  className="min-h-12 rounded-2xl border border-[#159fb3] px-4 font-bold text-[#087f8c]"
                  onClick={() => {
                    setStep('register');
                    setError('');
                  }}
                  type="button"
                >
                  Daftar sebagai Warga
                </button>
              ) : (
                whatsappUrl && (
                  <a
                    className="grid min-h-12 place-items-center rounded-2xl border border-green-600 px-4 text-center font-bold text-green-700"
                    href={whatsappUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Minta Bantuan Daftar via WhatsApp
                  </a>
                )
              )}
              <Link
                className="grid min-h-12 place-items-center text-center text-sm font-bold text-slate-600"
                to="/pickup/new"
              >
                Lanjutkan tanpa akun
              </Link>
              <button
                className="min-h-12 w-full text-sm font-bold text-slate-500"
                onClick={() => {
                  setStep('identifier');
                  setError('');
                }}
                type="button"
              >
                Ganti email atau nomor
              </button>
            </div>
          )}

          {step === 'password' && (
            <form className="mt-7 space-y-4" onSubmit={submitPassword}>
              <Field
                autoComplete="current-password"
                label="Password"
                name="password"
                type="password"
              />
              <PrimaryButton
                className="min-h-12 w-full"
                disabled={loading}
                type="submit"
              >
                {loading ? 'Memeriksa akun...' : 'Masuk'}
              </PrimaryButton>
              <button
                className="min-h-12 w-full text-sm font-bold text-slate-500"
                onClick={() => {
                  setStep(staffMode ? 'identifier' : 'choice');
                  setError('');
                }}
                type="button"
              >
                Ganti email atau nomor
              </button>
              {!staffMode && (
                <div className="grid gap-3 border-t border-slate-100 pt-4">
                  {identifierType === 'email' ? (
                    <button
                      className="min-h-12 rounded-2xl border border-[#159fb3] px-4 font-bold text-[#087f8c]"
                      onClick={() => {
                        setStep('register');
                        setError('');
                      }}
                      type="button"
                    >
                      Daftar sebagai Warga
                    </button>
                  ) : (
                    whatsappUrl && (
                      <a
                        className="grid min-h-12 place-items-center rounded-2xl border border-green-600 px-4 text-center font-bold text-green-700"
                        href={whatsappUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Minta Bantuan Daftar via WhatsApp
                      </a>
                    )
                  )}
                  <Link
                    className="grid min-h-12 place-items-center text-center text-sm font-bold text-slate-600"
                    to="/pickup/new"
                  >
                    Lanjutkan tanpa akun
                  </Link>
                </div>
              )}
            </form>
          )}

          {step === 'register' && (
            <form className="mt-7 space-y-4" onSubmit={submitRegistration}>
              <div className="rounded-2xl bg-[#e6f7fa] p-4 text-sm text-[#075e68]">
                Email akun: <strong>{identifier}</strong>
              </div>
              <Field
                autoComplete="new-password"
                label="Buat password"
                name="password"
                type="password"
              />
              <Field
                autoComplete="new-password"
                label="Ulangi password"
                name="confirmation"
                type="password"
              />
              <PrimaryButton
                className="min-h-12 w-full"
                disabled={loading}
                type="submit"
              >
                {loading ? 'Membuat akun...' : 'Buat Akun Warga'}
              </PrimaryButton>
              <button
                className="min-h-12 w-full text-sm font-bold text-slate-500"
                onClick={() => setStep('choice')}
                type="button"
              >
                Kembali
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            {!staffMode ? (
              <Link
                className="inline-flex min-h-12 items-center text-sm font-bold text-slate-500"
                to="/auth/staff"
              >
                Masuk sebagai petugas/operator
              </Link>
            ) : (
              <Link
                className="inline-flex min-h-12 items-center text-sm font-bold text-[#087f8c]"
                to="/auth"
              >
                Kembali ke akses warga
              </Link>
            )}
            <Link
              className="mx-auto mt-2 inline-flex min-h-12 items-center text-sm font-bold text-[#087f8c]"
              to="/app"
            >
              Kembali ke Pusat Layanan
            </Link>
          </div>
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
    <label className="block text-base font-bold">
      {label}
      <input
        className="mt-2 min-h-12 w-full rounded-2xl border border-[#d9e2e7] bg-white px-4 py-3 text-base outline-none focus:border-[#159fb3]"
        required
        {...props}
      />
    </label>
  );
}

function getWhatsAppUrl() {
  const phone = import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as
    | string
    | undefined;
  if (!phone) return undefined;
  const message =
    'Halo Peduli Pinrang, saya ingin dibantu membuat atau memulihkan akun warga.';
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
