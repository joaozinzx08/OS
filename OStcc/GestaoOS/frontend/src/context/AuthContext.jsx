import { createContext, useContext, useEffect, useState } from 'react';
import { api, send } from '../services/api';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  async function refresh() {
    setError('');
    try { const data = await api('/auth/me'); setSession(data); }
    catch (e) { if (e.status !== 401) setError(e.message); setSession(null); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); const expire = () => setSession(null); window.addEventListener('session-expired', expire); return () => window.removeEventListener('session-expired',expire); }, []);
  const login = async data => { const result = await api('/auth/login',send('POST',data)); setSession(result); setError(''); };
  const logout = async () => { try { await api('/auth/logout',{ method: 'POST' }); setSession(null); } catch(e) { if (e.status === 401) setSession(null); else throw e; } };
  return <Context.Provider value={{ ...session, loading, error, login, logout, refresh, clear: () => setSession(null) }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
