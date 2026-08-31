import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ArtisanCard from '../components/ArtisanCard';
import SearchFilters, { EMPTY_FILTERS, type FilterValues } from '../components/SearchFilters';
import { api } from '../lib/api';
import type { ArtisansResponse } from '../types';

const PAGE_SIZE = 12;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<FilterValues>({
    category: searchParams.get('category') ?? '',
    city: searchParams.get('city') ?? '',
    keyword: searchParams.get('keyword') ?? '',
    minRating: searchParams.get('minRating') ?? '',
  });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ArtisansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedKeyword = useRef<string>(filters.keyword);
  const [keywordReady, setKeywordReady] = useState(filters.keyword);

  // Debounce the free-text keyword 300ms; other filters apply instantly
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedKeyword.current = filters.keyword;
      setKeywordReady(filters.keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.keyword]);

  const buildQuery = useCallback(
    (currentFilters: FilterValues, currentPage: number) => {
      const params = new URLSearchParams();
      if (currentFilters.category) params.set('category', currentFilters.category);
      if (currentFilters.city) params.set('city', currentFilters.city);
      if (keywordReady) params.set('keyword', keywordReady);
      if (currentFilters.minRating) params.set('minRating', currentFilters.minRating);
      params.set('page', String(currentPage));
      params.set('limit', String(PAGE_SIZE));
      return params;
    },
    [keywordReady]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = buildQuery(filters, page);
    api
      .get<ArtisansResponse>(`/artisans?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Keep the URL shareable without triggering a navigation
    const urlParams = new URLSearchParams();
    if (filters.category) urlParams.set('category', filters.category);
    if (filters.city) urlParams.set('city', filters.city);
    if (keywordReady) urlParams.set('keyword', keywordReady);
    if (filters.minRating) urlParams.set('minRating', filters.minRating);
    setSearchParams(urlParams, { replace: true });

    return () => {
      cancelled = true;
    };
  }, [filters, page, keywordReady, buildQuery, setSearchParams]);

  const handleFilterChange = (next: FilterValues) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Find an artisan</h1>
      <p className="mt-1 text-sm text-slate-500">
        {result
          ? `${result.total} artisan${result.total === 1 ? '' : 's'} available`
          : 'Search across verified trades'}
      </p>

      <div className="mt-6">
        <SearchFilters values={filters} onChange={handleFilterChange} />
      </div>

      {error && (
        <div className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((artisan, index) => (
              <ArtisanCard key={artisan.$id} artisan={artisan} delay={(index % 6) * 70} />
            ))}
          </div>

          {result.totalPages > 1 && (
            <div
              className="mt-8 flex items-center justify-center gap-4 animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              <button
                disabled={result.page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {result.page} of {result.totalPages}
              </span>
              <button
                disabled={result.page >= result.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : !error ? (
        <div className="mt-16 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No artisans found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try widening your filters — fewer trades, another city, or clearing the keyword.
          </p>
          <button
            onClick={() => handleFilterChange(EMPTY_FILTERS)}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
