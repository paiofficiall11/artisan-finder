import { Link } from 'react-router-dom';
import type { Booking, ProfileMini, Role } from '../types';
import { avatarUrl } from '../lib/storage';
import StatusBadge from './StatusBadge';

interface BookingCardProps {
  booking: Booking;
  role: Role;
  counterpart?: ProfileMini;
  onAction?: (bookingId: string, status: string) => void;
  busy?: boolean;
  /** Optional stagger delay in ms applied to the entrance animation. */
  delay?: number;
}

const dateFormat = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function BookingCard({
  booking,
  role,
  counterpart,
  onAction,
  busy,
  delay = 0,
}: BookingCardProps) {
  const counterpartId = role === 'client' ? booking.artisanId : booking.clientId;
  const other = counterpart ?? undefined;
  const avatar = other ? avatarUrl(other.avatarFileId) : null;

  const canCancel = role === 'client' && ['pending', 'accepted'].includes(booking.status);
  const canAcceptDecline = role === 'artisan' && booking.status === 'pending';
  const canComplete = role === 'artisan' && booking.status === 'accepted';

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {other && (
            <>
              {avatar ? (
                <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                  {other.fullName.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                {role === 'client' ? (
                  <Link
                    to={`/artisans/${counterpartId}`}
                    className="font-semibold text-slate-900 hover:text-amber-700"
                  >
                    {other.fullName}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">{other.fullName}</span>
                )}
                <p className="text-xs text-slate-400">
                  {other.city ?? ''}
                  {other.category ? ` · ${other.category}` : ''}
                </p>
              </div>
            </>
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-2 text-right">
        <Link
          to={`/bookings/${booking.$id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
        >
          Track live progress →
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Trade</dt>
          <dd className="font-medium text-slate-700">{booking.category}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Preferred date</dt>
          <dd className="font-medium text-slate-700">
            {dateFormat.format(new Date(booking.preferredDate))}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Requested</dt>
          <dd className="font-medium text-slate-700">
            {dateFormat.format(new Date(booking.createdAt))}
          </dd>
        </div>
      </dl>

      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{booking.description}</p>
      <p className="mt-2 text-xs text-slate-400">📍 {booking.address}</p>

      {(canCancel || canAcceptDecline || canComplete) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {canAcceptDecline && (
            <>
              <button
                disabled={busy}
                onClick={() => onAction?.(booking.$id, 'accepted')}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                disabled={busy}
                onClick={() => onAction?.(booking.$id, 'declined')}
                className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}
          {canComplete && (
            <button
              disabled={busy}
              onClick={() => onAction?.(booking.$id, 'completed')}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              Mark completed
            </button>
          )}
          {canCancel && (
            <button
              disabled={busy}
              onClick={() => onAction?.(booking.$id, 'cancelled')}
              className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel request
            </button>
          )}
        </div>
      )}
    </div>
  );
}
