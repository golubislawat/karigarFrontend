import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function GoogleAuthButton({ role = 'consumer', text = 'signin_with', onSuccess, onError }) {
  const googleBtnRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const [errorModal, setErrorModal] = useState(false);

  useEffect(() => {
    const cid = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!cid || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: handleCredentialResponse,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: text,
          shape: 'rectangular',
        });
      }
    } catch (err) {
      console.error('Google Sign-In initialization error:', err);
    }
  }, [clientId, text]);

  const handleCredentialResponse = async (response) => {
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
    }
  };

  const handlePlaceholderClick = () => {
    setErrorModal(true);
  };

  return (
    <div className="w-full">
      {clientId ? (
        <div ref={googleBtnRef} className="w-full flex justify-center"></div>
      ) : (
        <button
          type="button"
          onClick={handlePlaceholderClick}
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

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-rule">
            <div className="w-12 h-12 rounded-2xl bg-goldbg text-gold flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-center font-display font-black text-[20px] text-ink mb-2">Google OAuth Setup</h3>
            <p className="text-[13px] text-mid text-center leading-relaxed mb-6">
              Google Sign-In ready hai! Bas aapko Google Cloud Console se apna <strong>Google Client ID</strong> lekar Vercel / <code>.env</code> me <code>VITE_GOOGLE_CLIENT_ID</code> add karna hoga.
            </p>
            <div className="bg-bg rounded-xl p-3 text-[12px] font-mono text-mid mb-6 break-all">
              VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
            </div>
            <button
              onClick={() => setErrorModal(false)}
              className="w-full py-3 bg-accent text-white font-bold rounded-xl shadow-premium hover:bg-accent/90 transition-all text-[14px]"
            >
              Samajh gaya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
