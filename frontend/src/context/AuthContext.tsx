import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, getToken, setToken } from '../lib/api';
import type { AuthResponse, Profile } from '../types';

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: 'client' | 'artisan';
  phone: string;
  city: string;
}

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  register: (input: RegisterInput) => Promise<Profile>;
  logout: () => void;
  setUser: (user: Profile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const profile = await api.get<Profile>('/auth/me');
        if (!cancelled) setUserState(profile);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();

    // api.ts fires this when a stored token stops working (expiry)
    const onUnauthorized = () => setUserState(null);
    window.addEventListener('af:unauthorized', onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('af:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setToken(result.token);
    setUserState(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await api.post<AuthResponse>('/auth/register', input);
    setToken(result.token);
    setUserState(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((next: Profile) => setUserState(next), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
