import { CATEGORIES, CITIES } from '../lib/constants';

export interface FilterValues {
  category: string;
  city: string;
  keyword: string;
  minRating: string;
}

export const EMPTY_FILTERS: FilterValues = { category: '', city: '', keyword: '', minRating: '' };

interface SearchFiltersProps {
  values: FilterValues;
  onChange: (next: FilterValues) => void;
}

export default function SearchFilters({ values, onChange }: SearchFiltersProps) {
  const set = (patch: Partial<FilterValues>) => onChange({ ...values, ...patch });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Trade
        </span>
        <select
          value={values.category}
          onChange={(event) => set({ category: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value="">All trades</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          City
        </span>
        <input
          list="af-cities"
          value={values.city}
          onChange={(event) => set({ city: event.target.value })}
          placeholder="e.g. Lagos"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
        <datalist id="af-cities">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Keyword
        </span>
        <input
          value={values.keyword}
          onChange={(event) => set({ keyword: event.target.value })}
          placeholder="name or bio…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Min rating
        </span>
        <select
          value={values.minRating}
          onChange={(event) => set({ minRating: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value="">Any</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
      </label>
    </div>
  );
}
