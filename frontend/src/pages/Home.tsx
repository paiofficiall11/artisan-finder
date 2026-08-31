import { Link } from 'react-router-dom';
import { CATEGORIES } from '../lib/constants';

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-amber-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find trusted artisans near you,{' '}
            <span className="text-amber-600">in minutes</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Electricians, plumbers, tailors, carpenters and more — browse verified profiles,
            compare skills and rates, and book the right artisan for the job.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/search"
              className="rounded-xl bg-amber-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              Find an Artisan
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Join as an Artisan
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
          Popular trades
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to={`/search?category=${encodeURIComponent(category)}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-700 hover:shadow-sm"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Search',
              text: 'Filter artisans by trade, city, rating and keyword to shortlist the right hands for the job.',
            },
            {
              step: '2',
              title: 'Book',
              text: 'Describe the work, pick a date and send a booking request — the artisan responds with accept or decline.',
            },
            {
              step: '3',
              title: 'Done',
              text: 'Track every request from your dashboard until the job is marked completed.',
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-slate-200 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-500">
          Artisan Finder · 3MTT Fellowship SD-06 · Built by Mustapha Aminu
        </div>
      </footer>
    </div>
  );
}
