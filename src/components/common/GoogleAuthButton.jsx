import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const DEFAULT_GOOGLE_CLIENT_ID = '157806632598-if3uqc0v1sehvrdlc0h9rcgiicuihubs.apps.googleusercontent.com';

export default function GoogleAuthButton({ role = 'consumer', text = 'signin_with', onSuccess, onError }) {
  const googleBtnRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', {
        googleToken: response.credential,
        role: role,
      });

      if (res.data.success) {
        const meRes = await api.get('/auth/me');
        const loggedInUser = meRes.data.data;
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

  const handleManualPrompt = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
      {loading && (
        <p className="text-[12px] text-accent2 font-bold mt-2 animate-pulse">Signing in with Google...</p>
      )}
    </div>
  );
}
