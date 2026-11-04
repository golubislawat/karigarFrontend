import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import GoogleAuthButton from '../../components/common/GoogleAuthButton';
import OtpInput from '../../components/common/OtpInput';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  // Mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password');

  // Form states
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Login states
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'thekedar' ? '/thekedar/dashboard' : '/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.registered) {
      setSuccess('Account created! Please sign in.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // 1. Password-based Login
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', form);
      const meRes = await api.get('/auth/me');
      const loggedInUser = meRes.data.data;
      login(loggedInUser);
      setSuccess(`Welcome back, ${loggedInUser.name}!`);
      setTimeout(() => {
        navigate(loggedInUser.role === 'thekedar' ? '/thekedar/dashboard' : '/');
      }, 600);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (data?.message) {
        setError(data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Send 6-digit OTP
  const handleSendOtp = async e => {
    if (e) e.preventDefault();
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', {
        email: form.email,
        purpose: 'LOGIN'
      });
      if (res.data.success) {
        setOtpSent(true);
        setOtpCountdown(60);
        setSuccess('6-digit verification code sent to your email!');
        if (res.data.data?.devOtp) {
          setDevOtp(res.data.data.devOtp);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Make sure you have an account.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP & Login
  const handleVerifyOtp = async e => {
    if (e) e.preventDefault();
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login-otp', {
        email: form.email,
        otp: otpValue
      });
      const meRes = await api.get('/auth/me');
      const loggedInUser = meRes.data.data;
      login(loggedInUser);
      setSuccess(`Welcome back, ${loggedInUser.name}!`);
      setTimeout(() => {
        navigate(loggedInUser.role === 'thekedar' ? '/thekedar/dashboard' : '/');
      }, 600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)] bg-bg">
      {/* LEFT PANEL: Branding & Social Proof */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-accent p-16">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent2 animate-pulse"></span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/80">Secure Portal</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display font-black leading-[0.9] tracking-tight text-white mb-6" style={{ fontSize: 'clamp(48px, 6vw, 84px)' }}>
            Welcome <br />
            <span className="text-accent3 italic font-medium">back.</span>
          </h1>
          <p className="text-[18px] text-white/60 max-w-sm leading-relaxed font-medium">
            Log in with password, 6-digit OTP, or Google to manage your bookings and team.
          </p>
        </div>

        <div className="relative z-10 space-y-4 max-w-sm">
          {[
            { n: '2.4k+', t: 'Verified Contractors' },
            { n: '18k+', t: 'Successful Jobs' },
            { n: '4.8★', t: 'Platform Rating' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
              <span className="font-display text-[24px] font-black text-accent2">{item.n}</span>
              <p className="text-[13px] font-bold text-white/70 uppercase tracking-widest">{item.t}</p>
            </div>
          ))}
        </div>

        {/* Abstract Background Element */}
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-accent2/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* RIGHT PANEL: The Form */}
      <div className="flex items-center justify-center p-8 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-[420px] animate-in slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-display font-black text-lg">K</div>
            <span className="font-display text-xl font-bold tracking-tight text-ink">KarigarNow</span>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-[36px] font-black tracking-tight text-ink mb-2">Sign in</h2>
            <p className="text-mid font-medium">
              New to KarigarNow? <Link to="/register" className="text-accent2 font-bold hover:underline">Create an account</Link>
            </p>
          </div>

          {/* 1. Google Sign-In Option */}
          <div className="mb-6">
            <GoogleAuthButton text="signin_with" onError={msg => setError(msg)} />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-[1px] flex-1 bg-rule"></div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">or sign in with</span>
            <div className="h-[1px] flex-1 bg-rule"></div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-bg border border-rule rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setError(''); setOtpSent(false); }}
              className={`py-2 text-[12px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                loginMode === 'password' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('otp'); setError(''); }}
              className={`py-2 text-[12px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                loginMode === 'otp' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              6-Digit OTP
            </button>
          </div>

          {/* Alert messages */}
          {success && (
            <div className="p-4 rounded-xl bg-gbg border border-green/20 text-green text-[13px] font-bold mb-6 flex items-center gap-3 animate-in fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{success}</span>
            </div>
          )}

          {devOtp && (
            <div className="p-4 rounded-xl bg-goldbg border border-gold/30 text-gold text-[12px] font-bold mb-6 flex items-center justify-between animate-in fade-in">
              <span>Demo OTP: <strong className="font-mono text-[16px] text-ink">{devOtp}</strong></span>
              <button
                type="button"
                onClick={() => setOtpValue(devOtp)}
                className="text-[11px] uppercase tracking-wider underline hover:text-ink"
              >
                Auto-fill
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rbg border border-red/20 text-red text-[13px] font-bold mb-6 flex items-center gap-3 animate-in fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Password Login */}
          {loginMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-mid uppercase tracking-widest px-0.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-rule bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all shadow-inner-soft text-[15px]"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-[12px] font-bold text-mid uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => { setLoginMode('otp'); handleSendOtp(); }}
                    className="text-[11px] font-bold text-accent2 hover:underline uppercase tracking-widest"
                  >
                    Login with OTP instead?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-rule bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all shadow-inner-soft text-[15px]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted hover:text-ink transition-colors uppercase tracking-widest"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-accent text-white font-bold rounded-xl shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
              >
                {loading ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>
          )}

          {/* TAB 2: OTP Login */}
          {loginMode === 'otp' && (
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-mid uppercase tracking-widest px-0.5">Your Registered Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-rule bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all shadow-inner-soft text-[15px]"
                      placeholder="you@example.com"
                    />
                    <p className="text-[12px] text-mid mt-1 px-0.5">
                      We will send a 6-digit verification code to this email.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !form.email}
                    className="w-full py-4 bg-accent text-white font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all disabled:opacity-50 text-[15px]"
                  >
                    {loading ? 'Sending Code...' : 'Send 6-Digit OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in">
                  <div className="text-center">
                    <p className="text-[13px] text-mid mb-2">
                      Enter the 6-digit OTP sent to <strong className="text-ink">{form.email}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpValue(''); }}
                      className="text-[11px] font-bold text-accent2 hover:underline uppercase tracking-wider"
                    >
                      Change Email
                    </button>
                  </div>

                  <OtpInput
                    value={otpValue}
                    onChange={setOtpValue}
                    onComplete={handleVerifyOtp}
                    disabled={loading}
                  />

                  <button
                    type="submit"
                    disabled={loading || otpValue.length !== 6}
                    className="w-full py-4 bg-accent text-white font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all disabled:opacity-50 text-[15px]"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Sign In'}
                  </button>

                  <div className="text-center pt-2">
                    {otpCountdown > 0 ? (
                      <span className="text-[12px] font-bold text-muted">Resend OTP in {otpCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[12px] font-bold text-accent2 hover:underline uppercase tracking-wider"
                      >
                        Resend 6-Digit OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-rule/50">
            <p className="text-center text-[12px] text-muted font-medium">
              By signing in, you agree to our <br/>
              <a href="#" className="text-mid hover:text-ink transition-colors underline">Terms of Service</a> and <a href="#" className="text-mid hover:text-ink transition-colors underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
