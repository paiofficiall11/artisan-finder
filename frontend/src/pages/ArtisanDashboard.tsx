import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookingCard from '../components/BookingCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { MyBookingsResponse, Profile } from '../types';

export default function ArtisanDashboard() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState<MyBookingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api.get<MyBookingsResponse>('/bookings/mine');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (bookingId: string, status: string) => {
    setBusyId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      setNotice(`Booking ${status}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const toggleAvailability = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const updated = await api.put<Profile>('/profile', { isAvailable: !user.isAvailable });
      setUser(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update availability');
    } finally {
      setToggling(false);
    }
  };

  const bookings = data?.items ?? [];
  const pending = bookings.filter((b) => b.status === 'pending');
  const accepted = bookings.filter((b) => b.status === 'accepted');
  const completed = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Artisan Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back{user ? `, ${user.fullName.split(' ')[0]}` : ''} — manage your incoming
            work here.
          </p>
        </div>
        <Link
          to="/profile"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Edit profile
        </Link>
      </div>

      {notice && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>
      )}
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Pending requests', value: pending.length, accent: 'text-amber-600' },
          { label: 'Accepted jobs', value: accepted.length, accent: 'text-blue-600' },
          { label: 'Completed jobs', value: completed.length, accent: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
            <p className={`mt-1 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <p className="font-semibold text-slate-900">Availability</p>
          <p className="text-sm text-slate-500">
            {user?.isAvailable
              ? 'You are listed in search results and can receive bookings.'
              : 'You are hidden from search results.'}
          </p>
        </div>
        <button
          onClick={toggleAvailability}
          disabled={toggling}
          className={`relative h-8 w-14 rounded-full transition ${
            user?.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
          } disabled:opacity-50`}
          aria-label="Toggle availability"
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              user?.isAvailable ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Incoming requests
            </h2>
            <div className="mt-3 space-y-4">
              {[...pending, ...accepted].map((booking) => (
                <BookingCard
                  key={booking.$id}
                  booking={booking}
                  role="artisan"
                  counterpart={data?.profiles[booking.clientId]}
                  onAction={handleAction}
                  busy={busyId === booking.$id}
                />
              ))}
              {pending.length + accepted.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                  No active requests right now. Keep your profile and portfolio up to date to
                  attract clients.
                </div>
              )}
            </div>
          </section>

          {bookings.filter((b) => ['declined', 'completed', 'cancelled'].includes(b.status)).length >
            0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Past jobs
              </h2>
              <div className="mt-3 space-y-4">
                {bookings
                  .filter((b) => ['declined', 'completed', 'cancelled'].includes(b.status))
                  .map((booking) => (
                    <BookingCard
                      key={booking.$id}
                      booking={booking}
                      role="artisan"
                      counterpart={data?.profiles[booking.clientId]}
                    />
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
