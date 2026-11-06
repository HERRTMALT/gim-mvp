import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthMe } from '../../shared/types';
import { api } from './api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  gymName: string;
  gymPhone: string;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [gymName, setGymName] = useState('Gimnasio');
  const [gymPhone, setGymPhone] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    api<AuthMe>('/auth/me')
      .then((me) => {
        if (!active) return;
        setGymName(me.gymName);
        setGymPhone(me.gymPhone);
        setStatus('authenticated');
      })
      .catch(() => {
        if (active) setStatus('unauthenticated');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.clear();
      setStatus('unauthenticated');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [queryClient]);

  const login = useCallback(async (password: string) => {
    await api('/auth/login', { method: 'POST', body: { password } });
    const me = await api<AuthMe>('/auth/me');
    setGymName(me.gymName);
    setGymPhone(me.gymPhone);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      queryClient.clear();
      setStatus('unauthenticated');
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, gymName, gymPhone, login, logout }),
    [status, gymName, gymPhone, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
