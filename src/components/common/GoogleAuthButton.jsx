import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function GoogleAuthButton({ role = 'consumer', text = 'signin_with', onSuccess, onError }) {
  const googleBtnRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', {
        googleToken: response.credential,
        role: role,
      });

      if (res.data.success) {
        if (res.data?.data?.token) {
          localStorage.setItem('karigar_token', res.data.data.token);
        }
        const meRes = await api.get('/auth/me');
        const loggedInUser = meRes.data.data;
        if (res.data?.data?.token && !loggedInUser.token) {
          loggedInUser.token = res.data.data.token;
        }
        login(loggedInUser);
        if (onSuccess) onSuccess(loggedInUser);
        navigate(loggedInUser.role === 'thekedar' ? '/thekedar/dashboard' : '/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed';
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) return;

    const renderBtn = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });

          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 380,
            text: text,
            shape: 'rectangular',
          });
          return true;
        } catch (e) {
          console.warn('Google render error:', e);
        }
      }
      return false;
    };

    if (!renderBtn()) {
      const interval = setInterval(() => {
        if (renderBtn()) clearInterval(interval);
      }, 300);
      const timer = setTimeout(() => clearInterval(interval), 6000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [clientId, text]);

  return (
    <div className="w-full flex flex-col items-center">
      {clientId ? (
        <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
      ) : (
        <button
          type="button"
          onClick={() => setShowConfigHelp(true)}
          className="w-full py-3.5 px-4 bg-white border border-rule hover:border-ink/20 rounded-xl text-ink font-bold text-[14px] flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>
      )}

      {loading && (
        <p className="text-[12px] text-accent2 font-bold mt-2 animate-pulse">Signing in with Google...</p>
      )}

      {showConfigHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-rule">
            <h3 className="font-display font-black text-[20px] text-ink mb-2">Google OAuth Setup</h3>
            <p className="text-[13px] text-mid leading-relaxed mb-4">
              Vercel Project Settings ➡️ Environment Variables me <code>VITE_GOOGLE_CLIENT_ID</code> add karein.
            </p>
            <button
              onClick={() => setShowConfigHelp(false)}
              className="w-full py-3 bg-accent text-white font-bold rounded-xl text-[14px]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
