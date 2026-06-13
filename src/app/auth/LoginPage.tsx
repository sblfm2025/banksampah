import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
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
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          SampahTa' Pinrang
        </p>
        <h1 className="mt-2 text-3xl font-bold">Masuk</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gunakan akun operator atau petugas yang terdaftar.
        </p>

        {profileMissing && authenticated && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Login berhasil, tetapi profil dan role akun belum dibuat pada
            Firestore.
            {authUid && (
              <code className="mt-3 block break-all rounded-lg bg-white p-3 text-xs">
                users/{authUid}
              </code>
            )}
            <button
              className="mt-3 block font-bold underline"
              onClick={() => void logout()}
              type="button"
            >
              Keluar dan gunakan akun lain
            </button>
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form
          className="mt-6 space-y-4"
          hidden={profileMissing && authenticated}
          onSubmit={submit}
        >
          <label className="block text-sm font-bold">
            Email
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-bold">
            Password
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Memeriksa akun...' : 'Masuk'}
          </button>
        </form>
      </div>
    </main>
  );
}
