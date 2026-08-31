import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { avatarUrl, portfolioUrl } from '../lib/storage';
import type { Profile } from '../types';

export default function ArtisanDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [artisan, setArtisan] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    api
      .get<Profile>(`/artisans/${id}`)
      .then((data) => {
        if (!cancelled) setArtisan(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-700">{error ?? 'Artisan not found'}</p>
        <Link to="/search" className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const avatar = avatarUrl(artisan.avatarFileId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/search" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Back to search
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 animate-scale-in">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {avatar ? (
              <img
                src={avatar}
                alt={artisan.fullName}
                className="h-20 w-20 rounded-full border border-slate-200 object-cover animate-pop"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-3xl font-bold text-amber-700 animate-pop">
                {artisan.fullName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{artisan.fullName}</h1>
              <p className="mt-1 font-medium text-amber-700">{artisan.category ?? 'Artisan'}</p>
              <p className="text-sm text-slate-500">
                📍 {artisan.city}
                {artisan.yearsExperience != null && artisan.yearsExperience > 0
                  ? ` · ${artisan.yearsExperience} yrs experience`
                  : ''}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-amber-600">
                  ★ {artisan.avgRating > 0 ? artisan.avgRating.toFixed(1) : 'New'}
                </span>
                {artisan.reviewCount > 0 && (
                  <span className="text-slate-400"> ({artisan.reviewCount} reviews)</span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            {artisan.hourlyRateNGN != null && artisan.hourlyRateNGN > 0 && (
              <p className="text-lg font-bold text-slate-900">
                ₦{artisan.hourlyRateNGN.toLocaleString()}
                <span className="text-sm font-normal text-slate-400"> /hr</span>
              </p>
            )}
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                artisan.isAvailable
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {artisan.isAvailable ? 'Available' : 'Currently unavailable'}
            </span>
          </div>
        </div>

        {artisan.bio && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              About
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600">{artisan.bio}</p>
          </div>
        )}

        {artisan.skills.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Skills
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {artisan.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6">
          {!user ? (
            <button
              onClick={() => navigate('/login', { state: { from: `/artisans/${artisan.$id}` } })}
              className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
            >
              Log in to request a booking
            </button>
          ) : user.role === 'client' ? (
            artisan.isAvailable ? (
              <Link
                to={`/book/${artisan.$id}`}
                className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
              >
                Request Booking
              </Link>
            ) : (
              <span className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-400">
                Artisan currently unavailable
              </span>
            )
          ) : (
            <span className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-medium text-slate-500">
              You are browsing as an artisan — booking is for client accounts
            </span>
          )}
        </div>
      </div>

      {artisan.portfolioFileIds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">Portfolio</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {artisan.portfolioFileIds.map((fileId) => (
              <img
                key={fileId}
                src={portfolioUrl(fileId)}
                alt={`${artisan.fullName} work sample`}
                className="aspect-square w-full rounded-xl border border-slate-200 object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
