import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BookingProgress from '../components/BookingProgress';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { avatarUrl } from '../lib/storage';
import type { Booking, MyBookingsResponse, ProfileMini } from '../types';

const POLL_INTERVAL = 4000;

const dateFormat = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [data, setData] = useState<{ booking: Booking; counterpart?: ProfileMini } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;
      try {
        const result = await api.get<MyBookingsResponse>('/bookings/mine');
        const booking = result.items.find((b) => b.$id === id);
        if (!booking) throw new Error('Booking not found');
        const counterpartField = user?.role === 'client' ? booking.artisanId : booking.clientId;
        setData({ booking, counterpart: result.profiles[counterpartField] });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
        if (!silent) setLoading(false);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, user]
  );

  useEffect(() => {
    let stop = false;
    const start = async () => {
      await load();
      if (stop) return;
      timerRef.current = window.setInterval(() => {
        load(true);
      }, POLL_INTERVAL);
    };
    start();
    return () => {
      stop = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [load]);

  const handleAction = async (status: string) => {
    if (!id) return;
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      setNotice(`Booking ${status}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { booking, counterpart } = data;
  const isClient = user?.role === 'client';
  const canCancel = isClient && ['pending', 'accepted'].includes(booking.status);
  const canAcceptDecline = !isClient && booking.status === 'pending';
  const canComplete = !isClient && booking.status === 'accepted';
  const avatar = counterpart ? avatarUrl(counterpart.avatarFileId) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to={isClient ? '/client' : '/artisan'}
        className="text-sm font-medium text-amber-700 hover:underline"
      >
        ← Back to dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booking progress</h1>
          {counterpart && (
            <div className="mt-2 flex items-center gap-2">
              {avatar ? (
                <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                  {counterpart.fullName.charAt(0).toUpperCase()}
                </span>
              )}
              <p className="text-sm text-slate-500">
                {isClient ? 'Booked with' : 'Booked by'} <span className="font-medium text-slate-700">{counterpart.fullName}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>
      )}
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 animate-fade-up">
        <BookingProgress status={booking.status} />
      </div>

      <dl
        className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2 animate-fade-up"
        style={{ animationDelay: '100ms' }}
      >
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Trade</dt>
          <dd className="mt-1 font-medium text-slate-700">{booking.category}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Preferred date</dt>
          <dd className="mt-1 font-medium text-slate-700">
            {dateFormat.format(new Date(booking.preferredDate))}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Address</dt>
          <dd className="mt-1 font-medium text-slate-700">📍 {booking.address}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Last updated</dt>
          <dd className="mt-1 font-medium text-slate-700">
            {dateFormat.format(new Date(booking.updatedAt))}
            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500 align-middle" />
          </dd>
        </div>
      </dl>

      <p
        className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 animate-fade-up"
        style={{ animationDelay: '180ms' }}
      >
        {booking.description}
      </p>

      {(canCancel || canAcceptDecline || canComplete) && (
        <div
          className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4 animate-fade-up"
          style={{ animationDelay: '260ms' }}
        >
          {canAcceptDecline && (
            <>
              <button
                disabled={busy}
                onClick={() => handleAction('accepted')}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Accept booking
              </button>
              <button
                disabled={busy}
                onClick={() => handleAction('declined')}
                className="rounded-lg border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}
          {canComplete && (
            <button
              disabled={busy}
              onClick={() => handleAction('completed')}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              Mark completed
            </button>
          )}
          {canCancel && (
            <button
              disabled={busy}
              onClick={() => handleAction('cancelled')}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel booking
            </button>
          )}
        </div>
      )}
    </div>
  );
}
