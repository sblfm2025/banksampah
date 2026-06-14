import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { isCustomerProfileComplete } from '../../shared/schemas/user.schema';
import { AppIcon, AppLogo, ErrorState, PrimaryButton } from '../ui/components';
import { useAuth } from './auth-context';

type LoginPanel = 'citizen' | 'staff';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const requestedNext = searchParams.get('next');
  const roleHint = searchParams.get('role');
  const initialPanel: LoginPanel =
    roleHint === 'operator' || roleHint === 'driver' || roleHint === 'admin'
      ? 'staff'
      : 'citizen';
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
  const [activePanel, setActivePanel] = useState<LoginPanel>(initialPanel);
  const whatsappUrl = getWhatsAppUrl();

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
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.95fr_1.05fr]">
      <section className="brand-grid hidden overflow-hidden p-12 text-white lg:flex lg:flex-col">
        <AppLogo inverse />
        <div className="my-auto max-w-xl">
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
          <div className="mt-8 grid max-w-md gap-3">
            {[
              'Warga masuk dengan Google dan melengkapi profil.',
              'Operator meninjau pengajuan dan mengatur jadwal.',
              'Petugas melihat alamat, kontak, dan foto warga.',
            ].map((item) => (
              <p
                className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 text-sm leading-6 text-cyan-50"
                key={item}
              >
                <AppIcon className="mt-0.5 h-4 w-4 shrink-0" name="check" />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
        <p className="text-xs text-cyan-100">
          Yayasan Masyarakat Peduli Pinrang
        </p>
      </section>
      <section className="grid place-items-center bg-[#f8fafc] px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgb(15_23_42/0.08)] sm:p-8">
          <div className="mb-8 lg:hidden">
            <AppLogo />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#159fb3]">
            Selamat datang
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Masuk ke akun</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Pilih akses sesuai kebutuhan. Warga bisa masuk cepat, petugas tetap
            memakai akun operasional yang terdaftar.
          </p>

          <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button
              className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                activePanel === 'citizen'
                  ? 'bg-white text-[#087f8c] shadow-sm'
                  : 'text-slate-500'
              }`}
              onClick={() => setActivePanel('citizen')}
              type="button"
            >
              Warga
            </button>
            <button
              className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                activePanel === 'staff'
                  ? 'bg-white text-[#087f8c] shadow-sm'
                  : 'text-slate-500'
              }`}
              onClick={() => setActivePanel('staff')}
              type="button"
            >
              Petugas
            </button>
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

          {activePanel === 'citizen' ? (
            <section className="mt-6 space-y-4">
              <button
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                disabled={loading}
                onClick={() => void googleLogin()}
                type="button"
              >
                <GoogleMark />
                Lanjutkan dengan Google
              </button>
              <div className="rounded-2xl border border-[#bde7ec] bg-[#f4fbfc] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#087f8c]">
                    <AppIcon name="phone" />
                  </span>
                  <div>
                    <h2 className="font-extrabold">
                      Belum punya email? Bisa dibantu via WhatsApp.
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Warga yang belum terbiasa memakai email dapat meminta
                      bantuan operator untuk pendaftaran dan pengisian profil.
                    </p>
                  </div>
                </div>
                {whatsappUrl ? (
                  <a
                    className="mt-4 inline-flex w-full justify-center rounded-2xl bg-green-600 px-4 py-3 font-bold text-white"
                    href={whatsappUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Daftar dibantu via WhatsApp
                  </a>
                ) : (
                  <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-500">
                    Nomor WhatsApp publik belum dikonfigurasi.
                  </p>
                )}
              </div>
            </section>
          ) : (
            <section className="mt-6">
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
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Akun khusus operator dan petugas.</span>
                  {whatsappUrl ? (
                    <a
                      className="font-bold text-[#087f8c]"
                      href={whatsappUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Lupa password?
                    </a>
                  ) : (
                    <span className="font-bold text-slate-400">
                      Lupa password?
                    </span>
                  )}
                </div>
                <PrimaryButton className="mt-2 w-full" disabled={loading} type="submit">
                  {loading ? 'Memeriksa akun...' : 'Masuk sebagai petugas'}
                </PrimaryButton>
              </form>
            </section>
          )}
          <Link
            className="mt-6 block text-center text-sm font-bold text-[#087f8c]"
            to="/"
          >
            Kembali ke halaman warga
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

function getWhatsAppUrl() {
  const phone = import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as
    | string
    | undefined;
  const message =
    (import.meta.env.VITE_PUBLIC_WHATSAPP_MESSAGE as string | undefined) ??
    'Halo Peduli Pinrang, saya ingin dibantu mendaftar atau masuk ke aplikasi Jemput Sampah.';

  if (!phone) {
    return undefined;
  }

  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
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
