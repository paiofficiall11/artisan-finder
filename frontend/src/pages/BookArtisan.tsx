import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { api } from '../lib/api';
import { avatarUrl } from '../lib/storage';
import type { Booking, Profile } from '../types';

const bookingSchema = z.object({
  description: z.string().trim().min(10, 'Describe the job in at least 10 characters').max(1000),
  preferredDate: z.string().min(1, 'Pick a preferred date and time'),
  address: z.string().trim().min(5, 'Enter the job address').max(256),
});

function toLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BookArtisan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [artisan, setArtisan] = useState<Profile | null>(null);
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<Profile>(`/artisans/${id}`)
      .then(setArtisan)
      .catch((err: Error) => setErrors([err.message]))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!artisan) return;

    const parsed = bookingSchema.safeParse({ description, preferredDate, address });
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      await api.post<Booking>('/bookings', {
        artisanId: artisan.$id,
        category: artisan.category ?? 'Other',
        description,
        preferredDate: new Date(parsed.data.preferredDate).toISOString(),
        address,
      });
      navigate('/client', { state: { bookingSent: true } });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Booking failed']);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!artisan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-semibold text-slate-700">{errors[0] ?? 'Artisan not found'}</p>
        <Link to="/search" className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const avatar = avatarUrl(artisan.avatarFileId);
  const minDate = toLocalDateTimeInput(new Date());

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to={`/artisans/${artisan.$id}`}
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Back to profile
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-900">Request a booking</h1>

        <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
          {avatar ? (
            <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700">
              {artisan.fullName.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className="font-semibold text-slate-900">{artisan.fullName}</p>
            <p className="text-sm text-slate-500">
              {artisan.category} · {artisan.city}
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Job description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Describe the work you need done — e.g. install 4 new sockets and fix the kitchen light…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Preferred date & time</span>
              <input
                type="datetime-local"
                value={preferredDate}
                min={minDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Address</span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="12 Adeola Odeku St, Victoria Island"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            The artisan will review this request and accept or decline. You can cancel any
            request before it is completed.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? 'Sending request…' : 'Send booking request'}
          </button>
        </form>
      </div>
    </div>
  );
}
