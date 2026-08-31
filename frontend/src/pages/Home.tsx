import { Link } from 'react-router-dom';
import { CATEGORIES } from '../lib/constants';
import Reveal from '../components/Reveal';

const TRADE_ICONS = ['🔧', '⚡', '🪚', '🧵', '🎨', '🧱', '🚗', '🔥', '🧺', '🏗️', '❄️', '🧼'];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-white">
        {/* Decorative floating blobs */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl animate-float" />
        <div
          className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center">
          <span
            className="inline-block rounded-full border border-amber-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700 animate-fade-up"
            style={{ backgroundImage: 'none' }}
          >
            Verified local tradespeople
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl animate-fade-up">
            Find trusted artisans
            <span className="mx-2 inline-block bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              near you
            </span>
            <span className="inline-block animate-bounce-soft"> 🔨</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            Electricians, plumbers, tailors, carpenters and more — browse verified profiles,
            compare skills and rates, and book the right artisan for the job.
          </p>

          <div
            className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              to="/search"
              className="group relative overflow-hidden rounded-xl bg-amber-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-amber-600/25 transition hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-600/30"
            >
              <span className="absolute inset-0 shimmer" />
              <span className="relative">Find an Artisan →</span>
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
            >
              Join as an Artisan
            </Link>
          </div>

          {/* Quick stat strip */}
          <div className="mt-14 grid grid-cols-3 gap-4 sm:max-w-lg sm:mx-auto animate-fade-up" style={{ animationDelay: '340ms' }}>
            {[
              { value: '12+', label: 'Trades covered' },
              { value: '24h', label: 'Response time' },
              { value: '100%', label: 'Verified pros' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur">
                <p className="text-2xl font-bold text-amber-600">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
            Popular trades
          </h2>
        </Reveal>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 stagger">
          {CATEGORIES.map((category, index) => (
            <Link
              key={category}
              to={`/search?category=${encodeURIComponent(category)}`}
              style={{ ['--i' as string]: index }}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 transition hover:-translate-y-1 hover:border-amber-400 hover:text-amber-700 hover:shadow-md"
            >
              <span className="text-xl transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                {TRADE_ICONS[index % TRADE_ICONS.length]}
              </span>
              <span className="text-sm sm:text-base">{category}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3">
          {[
            {
              step: '1',
              icon: '🔎',
              title: 'Search',
              text: 'Filter artisans by trade, city, rating and keyword to shortlist the right hands for the job.',
            },
            {
              step: '2',
              icon: '📅',
              title: 'Book',
              text: 'Describe the work, pick a date and send a booking request — the artisan responds with accept or decline.',
            },
            {
              step: '3',
              icon: '✅',
              title: 'Live track',
              text: 'Follow every request in real time from your dashboard or the progress page until the job is completed.',
            },
          ].map((item, index) => (
            <Reveal key={item.step} delay={index * 120}>
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg">
                <span className="pointer-events-none absolute -right-6 -top-6 text-7xl opacity-10 transition group-hover:scale-125 group-hover:opacity-20">
                  {item.icon}
                </span>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl font-bold text-amber-700">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            </Reveal>
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
