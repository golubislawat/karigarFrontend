import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import GoogleAuthButton from '../../components/common/GoogleAuthButton';
import OtpInput from '../../components/common/OtpInput';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Steps: 1 = Role, 2 = Form Details, 3 = OTP Verification
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  // OTP Verification
  const [otpValue, setOtpValue] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

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

  const selectRole = r => {
    setRole(r);
    setStep(2);
  };

  const goBack = () => {
    if (step === 3) {
      setStep(2);
      setOtpValue('');
    } else if (step === 2) {
      setStep(1);
    }
    setError('');
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email format';
    if (!form.mobile.trim()) return 'Mobile number is required';
    if (!/^\d{10}$/.test(form.mobile)) return 'Mobile must be exactly 10 digits';
    if (!form.password) return 'Password is required';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(form.password))
      return 'Password must contain uppercase, lowercase, number and special character (@$!%*?&)';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  // Step 2 Submission: Send 6-Digit OTP
  const handleInitiateRegister = async e => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/send-otp', {
        email: form.email,
        mobile: form.mobile,
        purpose: 'REGISTER'
      });

      if (res.data.success) {
        setStep(3);
        setOtpCountdown(60);
        setSuccess('6-digit verification code has been emailed to you. Please check your inbox!');
      }
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409 || data?.message) {
        setError(data?.message || 'Registration check failed');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submission: Verify OTP & Create Account
  const handleVerifyAndRegister = async e => {
    if (e) e.preventDefault();
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role: role,
        otp: otpValue,
      });

      if (res.data.success) {
        if (res.data?.data?.token) {
          localStorage.setItem('karigar_token', res.data.data.token);
        }
        // Auto-login newly registered user
        try {
          const meRes = await api.get('/auth/me');
          if (meRes.data.success) {
            const loggedIn = meRes.data.data;
            if (res.data?.data?.token && !loggedIn.token) {
              loggedIn.token = res.data.data.token;
            }
            login(loggedIn);
            navigate(role === 'thekedar' ? '/thekedar/dashboard' : '/');
            return;
          }
        } catch {
          // Fallback to login page with registered state
        }
        navigate('/login', { state: { registered: true } });
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.message) {
        setError(data.message);
      } else {
        setError('Verification failed. Invalid or expired OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)] bg-bg">
      {/* LEFT PANEL: Branding & Narrative */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-accent p-16">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent2 animate-pulse"></span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/80">Join the Network</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display font-black leading-[0.9] tracking-tight text-white mb-6" style={{ fontSize: 'clamp(48px, 6vw, 84px)' }}>
            Empowering <br />
            <span className="text-accent3 italic font-medium">labour.</span>
          </h1>
          <p className="text-[18px] text-white/60 max-w-sm leading-relaxed font-medium">
            Be part of India&apos;s most trusted ecosystem connecting skilled hands with quality projects.
          </p>
        </div>

        <div className="relative z-10 space-y-4 max-w-sm">
          {[
            { n: '01', t: 'Select your role' },
            { n: '02', t: 'Enter verified details' },
            { n: '03', t: 'Verify with 6-digit OTP' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="font-display text-[20px] font-black text-accent2 opacity-50">{item.n}</span>
              <p className="text-[13px] font-bold text-white/70 uppercase tracking-widest">{item.t}</p>
            </div>
          ))}
        </div>

        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-accent2/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* RIGHT PANEL: Steps & Form */}
      <div className="flex items-center justify-center p-8 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-[460px] animate-in slide-up">
          {/* Mobile logo & Back button */}
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-display font-black text-lg">K</div>
              <span className="font-display text-xl font-bold tracking-tight text-ink">KarigarNow</span>
            </div>
            {step > 1 && (
              <button onClick={goBack} className="text-[12px] font-bold text-accent2 uppercase tracking-widest flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                Back
              </button>
            )}
          </div>

          {/* Desktop Back link */}
          {step > 1 && (
            <button
              onClick={goBack}
              className="hidden lg:flex items-center gap-2 text-[12px] font-bold text-muted hover:text-ink transition-colors uppercase tracking-widest mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              Previous step
            </button>
          )}

          {/* Alerts */}
          {success && (
            <div className="p-4 rounded-xl bg-gbg border border-green/20 text-green text-[13px] font-bold mb-6 flex items-center gap-3 animate-in fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{success}</span>
            </div>
          )}



          {error && (
            <div className="p-4 rounded-xl bg-rbg border border-red/20 text-red text-[13px] font-bold mb-6 flex items-center gap-3 animate-in fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-[36px] font-black tracking-tight text-ink mb-2">Create Account</h2>
                <p className="text-mid font-medium">How would you like to participate?</p>
              </div>

              {/* Google Sign-in */}
              <div className="pt-2">
                <GoogleAuthButton role="consumer" text="signup_with" onError={msg => setError(msg)} />
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="h-[1px] flex-1 bg-rule"></div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-widest">or choose your role</span>
                <div className="h-[1px] flex-1 bg-rule"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => selectRole('consumer')}
                  className="w-full text-left p-6 rounded-2xl border-2 border-rule bg-white hover:border-accent hover:shadow-premium-hover transition-all group relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-bg2 flex items-center justify-center text-ink group-hover:bg-accent group-hover:text-white transition-colors mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                  </div>
                  <h3 className="font-display text-[20px] font-bold text-ink mb-1 group-hover:text-accent transition-colors">I need service</h3>
                  <p className="text-[13px] text-mid font-medium leading-relaxed">Book trusted contractors, skilled plumbers, electricians & verified teams.</p>
                </button>

                <button
                  type="button"
                  onClick={() => selectRole('thekedar')}
                  className="w-full text-left p-6 rounded-2xl border-2 border-rule bg-white hover:border-accent hover:shadow-premium-hover transition-all group relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-bg2 flex items-center justify-center text-ink group-hover:bg-accent group-hover:text-white transition-colors mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <h3 className="font-display text-[20px] font-bold text-ink mb-1 group-hover:text-accent transition-colors">I am a Thekedar / Contractor</h3>
                  <p className="text-[13px] text-mid font-medium leading-relaxed">Manage your labour workforce, accept local construction bookings & grow earnings.</p>
                </button>
              </div>

              <div className="pt-6 text-center">
                <p className="text-mid font-medium text-[14px]">
                  Already have an account? <Link to="/login" className="text-accent2 font-bold hover:underline">Sign in</Link>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Profile Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ap border border-accent2/20 mb-3 text-[11px] font-bold uppercase tracking-wider text-accent">
                  Role: {role}
                </div>
                <h2 className="font-display text-[32px] font-black tracking-tight text-ink mb-1">Your Details</h2>
                <p className="text-mid font-medium text-[14px]">Enter your information to receive a 6-digit verification code.</p>
              </div>

              <form onSubmit={handleInitiateRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-mid uppercase tracking-widest px-0.5">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-rule bg-white focus:border-accent outline-none text-[14px]"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-mid uppercase tracking-widest px-0.5">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-white focus:border-accent outline-none text-[14px]"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-mid uppercase tracking-widest px-0.5">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      required
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-white focus:border-accent outline-none text-[14px]"
                      placeholder="10-digit number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-mid uppercase tracking-widest px-0.5">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-white focus:border-accent outline-none text-[14px]"
                      placeholder="Min 8 chars, 1 capital, 1 symbol"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-mid uppercase tracking-widest px-0.5">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-white focus:border-accent outline-none text-[14px]"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-accent text-white font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all disabled:opacity-50 text-[15px]"
                >
                  {loading ? 'Sending Verification Code...' : 'Send 6-Digit OTP'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: OTP Verification */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center">
                <div className="w-14 h-14 bg-ap text-accent2 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent2/20">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <h2 className="font-display text-[32px] font-black tracking-tight text-ink mb-1">Verify Email</h2>
                <p className="text-[14px] text-mid">
                  Enter the 6-digit OTP code sent to <strong className="text-ink">{form.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                <OtpInput
                  value={otpValue}
                  onChange={setOtpValue}
                  onComplete={handleVerifyAndRegister}
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={loading || otpValue.length !== 6}
                  className="w-full py-4 bg-accent text-white font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all disabled:opacity-50 text-[15px]"
                >
                  {loading ? 'Verifying & Creating Account...' : 'Verify & Complete Registration'}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-[12px] font-bold text-muted hover:text-ink uppercase tracking-wider"
                  >
                    Edit Details
                  </button>
                  {otpCountdown > 0 ? (
                    <span className="text-[12px] font-bold text-muted">Resend code in {otpCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInitiateRegister}
                      className="text-[12px] font-bold text-accent2 hover:underline uppercase tracking-wider"
                    >
                      Resend 6-Digit OTP
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-rule/50">
            <p className="text-center text-[12px] text-muted font-medium">
              By creating an account, you agree to our <br/>
              <a href="#" className="text-mid hover:text-ink transition-colors underline">Terms of Service</a> and <a href="#" className="text-mid hover:text-ink transition-colors underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
