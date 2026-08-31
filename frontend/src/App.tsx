import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import ArtisanDetail from './pages/ArtisanDetail';
import BookArtisan from './pages/BookArtisan';
import ClientDashboard from './pages/ClientDashboard';
import ArtisanDashboard from './pages/ArtisanDashboard';
import ProfileEdit from './pages/ProfileEdit';
import { useAuth } from './context/AuthContext';

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'artisan' ? '/artisan' : '/client'} replace />;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/artisans/:id" element={<ArtisanDetail />} />
          <Route
            path="/book/:id"
            element={
              <ProtectedRoute role="client">
                <BookArtisan />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route
            path="/client"
            element={
              <ProtectedRoute role="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artisan"
            element={
              <ProtectedRoute role="artisan">
                <ArtisanDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <p className="text-5xl font-bold text-slate-300">404</p>
                <p className="mt-2 font-semibold text-slate-700">Page not found</p>
                <Link to="/" className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline">
                  Back home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
