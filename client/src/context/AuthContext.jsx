import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from '../services/authService.js';
import { TOKEN_KEY } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    auth.getProfile()
      .then((r) => setUser(r.data.user))
      .catch((e) => { if (e.status === 401 || e.status === 403) localStorage.removeItem(TOKEN_KEY); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = () => { setUser(null); toast.error('Your session has expired. Please login again.'); };
    window.addEventListener('ud:unauthorized', h);
    return () => window.removeEventListener('ud:unauthorized', h);
  }, [toast]);

  const setSession = useCallback((data) => { localStorage.setItem(TOKEN_KEY, data.token); setUser(data.user); }, []);
  const logout = useCallback(async () => { await auth.logout(); localStorage.removeItem(TOKEN_KEY); setUser(null); }, []);
  const isAdmin = user && user.role !== 'USER';

  return <Ctx.Provider value={{ user, setUser, loading, setSession, logout, isAdmin, isSuperAdmin: user?.role === 'SUPER_ADMIN' }}>{children}</Ctx.Provider>;
}
