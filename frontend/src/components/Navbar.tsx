import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { avatarUrl } from '../lib/storage';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-amber-700' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-lg font-bold text-white">
            A
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Artisan<span className="text-amber-600">Finder</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/search" className={linkClass}>
            Find Artisans
          </NavLink>
          {user?.role === 'client' && (
            <NavLink to="/client" className={linkClass}>
              My Bookings
            </NavLink>
          )}
          {user?.role === 'artisan' && (
            <NavLink to="/artisan" className={linkClass}>
              Dashboard
            </NavLink>
          )}
          {user && (
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.avatarFileId ? (
                <img
                  src={avatarUrl(user.avatarFileId) ?? undefined}
                  alt=""
                  className="hidden h-8 w-8 rounded-full border border-slate-200 object-cover sm:block"
                />
              ) : (
                <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 sm:flex">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden text-sm font-medium text-slate-700 md:block">
                {user.fullName.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
