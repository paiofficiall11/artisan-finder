import { Link } from 'react-router-dom';
import type { Profile } from '../types';
import { avatarUrl } from '../lib/storage';

export default function ArtisanCard({ artisan }: { artisan: Profile }) {
  const avatar = avatarUrl(artisan.avatarFileId);

  return (
    <Link
      to={`/artisans/${artisan.$id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt={artisan.fullName}
            className="h-14 w-14 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-700">
            {artisan.fullName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-amber-700">
            {artisan.fullName}
          </h3>
          <p className="text-sm text-slate-500">{artisan.category ?? 'Artisan'}</p>
          <p className="mt-0.5 text-xs text-slate-400">{artisan.city}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-amber-600">
            ★ {artisan.avgRating > 0 ? artisan.avgRating.toFixed(1) : 'New'}
          </div>
          <div className="text-xs text-slate-400">
            {artisan.reviewCount > 0 ? `${artisan.reviewCount} reviews` : ''}
          </div>
        </div>
      </div>

      {artisan.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {artisan.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        {artisan.hourlyRateNGN != null && artisan.hourlyRateNGN > 0 ? (
          <span className="text-sm font-medium text-slate-700">
            ₦{artisan.hourlyRateNGN.toLocaleString()}
            <span className="text-xs font-normal text-slate-400"> /hr</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Rate on request</span>
        )}
        <span className="text-sm font-medium text-amber-600 group-hover:underline">
          View profile →
        </span>
      </div>
    </Link>
  );
}
