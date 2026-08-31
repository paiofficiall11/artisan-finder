import type { BookingStatus } from '../types';

interface BookingProgressProps {
  status: BookingStatus;
}

const MAIN_STEPS: { key: BookingStatus; label: string; description: string }[] = [
  { key: 'pending', label: 'Requested', description: 'Waiting for the artisan to respond.' },
  { key: 'accepted', label: 'Accepted', description: 'The artisan confirmed your booking.' },
  { key: 'completed', label: 'Completed', description: 'The job has been finished.' },
];

const TERMINAL: Record<BookingStatus, { label: string; description: string } | null> = {
  pending: null,
  accepted: null,
  completed: null,
  declined: {
    label: 'Declined',
    description: 'The artisan could not take this job.',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This booking request was cancelled.',
  },
};

function currentIndex(status: BookingStatus): number {
  if (status === 'completed') return 2;
  if (status === 'accepted') return 1;
  return 0;
}

export default function BookingProgress({ status }: BookingProgressProps) {
  const activeIndex = currentIndex(status);
  const terminal = TERMINAL[status];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Live progress
      </h3>

      <ol className="mt-4 flex items-center">
        {MAIN_STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
                    isDone || status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-amber-500 text-white animate-pulse-ring'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone || status === 'completed' ? (
                    <span className="animate-pop">✓</span>
                  ) : (
                    index + 1
                  )}
                  {isCurrent && (
                    <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-amber-400/50 animate-spin-slow" style={{ borderRadius: '9999px' }} />
                  )}
                </span>
                <span
                  className={`mt-2 text-xs font-semibold transition-colors ${
                    isCurrent ? 'text-amber-700' : 'text-slate-700'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < MAIN_STEPS.length - 1 && (
                <span
                  className={`relative mx-2 mb-6 h-1.5 flex-1 overflow-hidden rounded-full ${
                    isDone || status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  {(isCurrent || status === 'accepted') && (
                    <span className="absolute inset-y-0 w-1/3 rounded-full bg-white/50 progress-flow" />
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-center text-sm text-slate-500">
        {terminal ? (
          <>
            <span className={`font-semibold ${terminal.label === 'Declined' ? 'text-red-600' : 'text-slate-600'}`}>
              {terminal.label}
            </span>
            — {terminal.description}
          </>
        ) : (
          MAIN_STEPS[activeIndex].description
        )}
      </p>
    </div>
  );
}
