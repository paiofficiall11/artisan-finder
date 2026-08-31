import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BookingCard from '../components/BookingCard';
import { api } from '../lib/api';
import type { MyBookingsResponse } from '../types';

export default function ClientDashboard() {
  const location = useLocation() as { state?: { bookingSent?: boolean } };
  const [data, setData] = useState<MyBookingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    location.state?.bookingSent ? 'Booking request sent — the artisan will respond shortly.' : null
  );

  const load = useCallback(async () => {
    try {
      const result = await api.get<MyBookingsResponse>('/bookings/mine');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
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
      setNotice(`Request ${status}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const bookings = data?.items ?? [];
  const active = bookings.filter((b) => ['pending', 'accepted'].includes(b.status));
  const history = bookings.filter((b) => !['pending', 'accepted'].includes(b.status));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Requests you have sent to artisans, and their responses.
          </p>
        </div>
      </div>

      {notice && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>
      )}
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No bookings yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Find an artisan and send your first booking request.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Active
              </h2>
              <div className="mt-3 space-y-4">
                {active.map((booking, index) => (
                  <BookingCard
                    key={booking.$id}
                    booking={booking}
                    role="client"
                    counterpart={data?.profiles[booking.artisanId]}
                    onAction={handleAction}
                    busy={busyId === booking.$id}
                    delay={index * 90}
                  />
                ))}
              </div>
            </section>
          )}

          {history.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                History
              </h2>
              <div className="mt-3 space-y-4">
                {history.map((booking, index) => (
                  <BookingCard
                    key={booking.$id}
                    booking={booking}
                    role="client"
                    counterpart={data?.profiles[booking.artisanId]}
                    delay={index * 70}
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
