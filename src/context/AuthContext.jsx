import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        if (res.data.success) {
          setUser(res.data.data);
          if (res.data.data?.token) {
            localStorage.setItem('karigar_token', res.data.data.token);
          }
        }
      })
      .catch(() => {
        localStorage.removeItem('karigar_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Login from API call — used by Login page
  const loginFromApi = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      if (res.data.data?.token) {
        localStorage.setItem('karigar_token', res.data.data.token);
      }
      // Fetch full user data
      const meRes = await api.get('/auth/me');
      const loggedIn = meRes.data.data;
      if (res.data.data?.token && !loggedIn.token) {
        loggedIn.token = res.data.data.token;
      }
      setUser(loggedIn);
      return meRes.data;
    }
    return res.data;
  };

  // Set user directly — used after login page gets user from /auth/me
  const login = (userData) => {
    if (userData?.token) {
      localStorage.setItem('karigar_token', userData.token);
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore errors
    } finally {
      localStorage.removeItem('karigar_token');
      setUser(null);
    }
  };

  const isConsumer = () => user?.role === 'consumer';
  const isThekedar = () => user?.role === 'thekedar';

  return (
    <AuthContext.Provider value={{ user, loading, login, loginFromApi, logout, isConsumer, isThekedar }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
