import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STEPS = ['pending', 'accepted', 'dispatched', 'in_progress', 'completed'];

const STATUS_COLORS = {
  pending: 'bg-goldbg text-gold border-gold/10',
  accepted: 'bg-bluebg text-blue border-blue/10',
  dispatched: 'bg-gbg text-green border-green/10',
  in_progress: 'bg-ap text-accent border-accent/10',
  completed: 'bg-gbg text-green border-green/10',
  cancelled: 'bg-rbg text-red border-red/10',
};

const STEP_LABELS = {
  pending: 'Booked',
  accepted: 'Confirmed',
  dispatched: 'On the Way',
  in_progress: 'Working',
  completed: 'Done',
};

// ── OTP Input Form (Consumer Verification) ────────────────────────────────────────────
function OtpInputForm({ bookingId, onVerified }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  const allFilled = digits.every(d => d !== '');

  const handleChange = (idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    setError('');
    if (clean && idx < 3) {
      inputRefs[idx + 1].current?.focus();
    }
    if (next.every(d => d !== '')) {
      inputRefs[3].current?.blur();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx] === '' && idx > 0) {
        inputRefs[idx - 1].current?.focus();
      } else {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    if (pasted.length > 0) {
      const next = [...digits];
      pasted.forEach((c, i) => { if (i < 4) next[i] = c; });
      setDigits(next);
      const lastIdx = Math.min(pasted.length, 3);
      inputRefs[lastIdx].current?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!allFilled) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/bookings/${bookingId}/verify-otp`, { otp: digits.join('') });
      if (res.data.success) {
        onVerified();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please check your email and re-enter.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDigits(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl p-8 mb-8 bg-white border border-rule shadow-premium text-center animate-in slide-up relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
      <div className="w-14 h-14 bg-ap text-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner-soft">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
      </div>
      <h3 className="text-[14px] font-black uppercase tracking-[0.15em] text-ink mb-2">Team Arrived? Enter Verification Code</h3>
      <p className="text-[13px] font-medium text-mid leading-relaxed max-w-md mx-auto mb-6">
        A 4-digit verification code has been sent to your registered email address. Enter the code below when workers arrive to officially start the session.
      </p>
      <div className="flex justify-center gap-3 mb-6">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-14 h-16 rounded-xl text-center text-2xl font-black transition-all ${
              error ? 'border-red text-red ring-red/10' : 'border-rule text-ink focus:border-accent2 focus:ring-4 focus:ring-accent2/5'
            } bg-bg border-2 outline-none font-display`}
            style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}
          />
        ))}
      </div>
      {error && <p className="text-red text-[12px] font-bold mb-6 animate-in fade-in">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!allFilled || loading}
        className="w-full max-w-xs mx-auto py-4 rounded-xl bg-accent text-white text-[13px] font-bold uppercase tracking-widest shadow-premium hover:bg-ink transition-all disabled:opacity-50"
      >
        {loading ? 'Validating...' : 'Verify Code & Start Session'}
      </button>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

// ── Star Rating (Premium Interaction) ───────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-all hover:scale-125 active:scale-95"
        >
          <svg className={`w-8 h-8 ${star <= (hover || value) ? 'text-accent2 fill-accent2' : 'text-rule stroke-rule fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchBooking = () => {
    setLoading(true);
    setError('');
    api.get(`/bookings/${id}`)
      .then(res => { if (res.data.success) setBooking(res.data.data); })
      .catch(() => setError('Failed to load booking details.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const currentStepIdx = STATUS_STEPS.indexOf(booking?.booking_status);

  const handleVerified = () => {
    showToast('Session verified! Work has started.');
    fetchBooking();
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/bookings/${id}/complete`);
      if (res.data.success) {
        setConfirmComplete(false);
        showToast('Payment released. Job completed successfully.');
        fetchBooking();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      const res = await api.put(`/bookings/${id}/cancel`);
      if (res.data.success) {
        setConfirmCancel(false);
        showToast('Booking cancelled. Processing refund.');
        fetchBooking();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async e => {
    e.preventDefault();
    if (rating === 0) { showToast('Please select a rating.'); return; }
    if (booking?.has_review || submittingReview) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        booking_id: id,
        thekedar_id: booking.thekedar_id || booking.thekedar?.id,
        rating,
        comment: reviewComment,
      });
      showToast('Thank you for your feedback!');
      setBooking(prev => ({ ...prev, has_review: true }));
      fetchBooking();
    } catch (err) {
      const msg = err.response?.data?.message || 'Review submission failed.';
      showToast(msg);
      if (msg.toLowerCase().includes('already')) {
        setBooking(prev => ({ ...prev, has_review: true }));
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pt-24 pb-32 px-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-6 py-3 rounded-full bg-ink text-white text-[13px] font-bold shadow-premium border border-white/10 animate-in fade-in flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent2 animate-pulse"></span>
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Back nav */}
        <nav className="mb-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted">
          <Link to="/bookings" className="hover:text-accent transition-colors">My Bookings</Link>
          <span className="opacity-30">/</span>
          <span className="text-ink">{booking?.service?.name || 'Order Details'}</span>
        </nav>

        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-3xl bg-white border border-rule/30" />
            <div className="h-32 rounded-3xl bg-white border border-rule/30" />
          </div>
        )}

        {error && (
          <div className="bg-white p-12 rounded-3xl border border-rule text-center shadow-premium animate-in fade-in">
             <div className="w-16 h-16 bg-rbg text-red rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <p className="text-ink font-bold text-lg mb-2">{error}</p>
             <button onClick={fetchBooking} className="text-accent2 font-bold hover:underline uppercase text-[12px] tracking-widest">Retry Request</button>
          </div>
        )}

        {booking && !loading && (
          <div className="animate-in slide-up">
            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[booking.booking_status] || ''}`}>
                    {booking.booking_status?.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-bold text-muted tabular-nums">Order ID: #{id.slice(-6).toUpperCase()}</span>
                </div>
                <h1 className="font-display text-[40px] font-black text-ink tracking-tight leading-none mb-2">
                  {booking.service?.name}
                </h1>
                <p className="text-mid font-medium flex items-center gap-2">
                  Managed by <span className="text-ink font-bold">{booking.thekedar_name}</span>
                </p>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-rule shadow-sm">
                <div className="w-10 h-10 rounded-full bg-accent2 text-white flex items-center justify-center font-display font-black text-sm">
                   {booking.thekedar_name?.charAt(0)}
                </div>
                <div className="text-left pr-4">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Support Line</p>
                  <p className="text-[13px] font-bold text-ink">+91 98XXX XXXXX</p>
                </div>
              </div>
            </div>

            {/* ── TIMELINE ── */}
            <div className="bg-white rounded-3xl p-8 border border-rule shadow-premium mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-10">Operational Timeline</h2>
              <div className="flex items-center">
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx;
                  const active = idx === currentStepIdx;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black transition-all duration-500 border-2 ${
                            done 
                              ? 'bg-accent border-accent text-white shadow-md' 
                              : 'bg-white border-rule text-rule'
                          } ${active ? 'ring-4 ring-accent/10 animate-pulse scale-110' : ''}`}
                        >
                          {done ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          ) : idx + 1}
                        </div>
                        <p className={`mt-4 text-[10px] font-black uppercase tracking-widest text-center leading-none ${done ? 'text-ink' : 'text-muted'}`}>
                          {STEP_LABELS[step]}
                        </p>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-1000 ${idx < currentStepIdx ? 'bg-accent' : 'bg-rule/30'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
              <div className="space-y-8">
                {/* OTP Verification Interaction */}
                {booking.booking_status === 'accepted' && (
                  <div className="bg-bluebg/20 border border-blue/10 rounded-3xl p-8 text-center animate-in fade-in">
                    <div className="w-12 h-12 bg-bluebg text-blue rounded-full flex items-center justify-center mx-auto mb-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </div>
                    <h3 className="text-blue font-bold text-[16px] mb-2">Order Confirmed — Preparing Dispatch</h3>
                    <p className="text-mid text-[13px] font-medium leading-relaxed max-w-sm mx-auto">
                      The contractor has accepted your request and is assembling the workforce. You will be notified with a verification code via email when they depart.
                    </p>
                  </div>
                )}

                {booking.booking_status === 'dispatched' && (
                  <OtpInputForm bookingId={id} onVerified={handleVerified} />
                )}

                {/* Status Banners */}
                {booking.booking_status === 'in_progress' && (
                  <div className="bg-gbg/40 border border-green/10 rounded-3xl p-8 flex items-center gap-6 animate-in scale-in">
                    <div className="w-16 h-16 bg-gbg text-green rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner-soft">
                       <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div>
                      <h3 className="text-green font-black uppercase tracking-widest text-[14px] mb-1">Session Active</h3>
                      <p className="text-mid text-[13px] font-medium leading-relaxed">
                        Arrival verified successfully. Labor force is currently working on site.
                      </p>
                    </div>
                  </div>
                )}

                {/* Job Specifications */}
                <div className="bg-white rounded-3xl p-8 border border-rule shadow-premium space-y-6">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Order Specifications</h2>
                  <div className="grid grid-cols-2 gap-8 pb-6 border-b border-rule/50">
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Scheduled Time</p>
                      <p className="text-[15px] font-bold text-ink">{formatDate(booking.scheduled_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Labor Force</p>
                      <p className="text-[15px] font-bold text-ink">{booking.workers_needed} Worker{booking.workers_needed > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Service Address</p>
                    <p className="text-[14px] font-medium text-ink leading-relaxed">
                      {booking.address?.address_line1}, {booking.address?.city}<br/>
                      {booking.address?.state} {booking.address?.postal_code}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Detailed Brief</p>
                    <p className="text-[14px] font-medium text-mid leading-relaxed italic bg-bg p-4 rounded-xl border border-rule/50">
                      &quot;{booking.job_description}&quot;
                    </p>
                  </div>
                </div>

                {/* Worker Profiles */}
                {booking.assigned_workers?.length > 0 && (
                  <div className="bg-white rounded-3xl p-8 border border-rule shadow-premium">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-6">Verified Personnel</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {booking.assigned_workers.map(w => (
                        <div key={w.id} className="flex items-center gap-4 p-4 rounded-2xl bg-bg border border-rule/50 group hover:border-accent2 transition-all">
                          <div className="w-12 h-12 rounded-full bg-white border border-rule flex items-center justify-center text-accent2 font-display font-black group-hover:bg-accent2 group-hover:text-white transition-all">
                            {w.name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-ink truncate">{w.name}</p>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-widest truncate">
                              {Array.isArray(w.skills) ? w.skills.slice(0, 2).join(' • ') : w.skills}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Actions & Financials */}
              <aside className="space-y-6">
                {/* Financial Summary */}
                <div className="bg-ink text-white rounded-3xl p-8 shadow-premium overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent2/10 rounded-full blur-2xl -z-0"></div>
                  <div className="relative z-10 space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Current Payout</p>
                      <p className="text-[32px] font-display font-black tabular-nums">{formatCurrency(booking.total_amount)}</p>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-white/10 text-[13px]">
                      <div className="flex justify-between font-medium opacity-60">
                        <span>Labor Fees</span>
                        <span className="tabular-nums">{formatCurrency(booking.thekedar_payout || (booking.total_amount ? booking.total_amount * 0.95 : 0))}</span>
                      </div>
                      <div className="flex justify-between font-medium opacity-60">
                        <span>Service Fee</span>
                        <span className="tabular-nums">{formatCurrency(booking.platform_fee || (booking.total_amount ? booking.total_amount * 0.05 : 0))}</span>
                      </div>
                      <div className="flex justify-between font-black pt-3 border-t border-white/10 uppercase tracking-widest text-[11px]">
                        <span>Payment Status</span>
                        <span className="text-accent2">{booking.payment_status?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {booking.booking_status === 'in_progress' && (
                    <div className="space-y-4">
                      {confirmComplete ? (
                        <div className="p-6 rounded-2xl bg-white border-2 border-accent2 animate-in scale-in">
                          <h3 className="text-[14px] font-black uppercase tracking-widest text-ink mb-2">Finalize Work?</h3>
                          <p className="text-[12px] text-mid font-medium leading-relaxed mb-6">
                            This will release <span className="text-ink font-bold tabular-nums">{formatCurrency(booking.thekedar_payout)}</span> from escrow to the contractor.
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmComplete(false)} className="py-3 rounded-xl border border-rule text-[12px] font-black uppercase tracking-widest text-muted hover:bg-bg">Cancel</button>
                            <button onClick={handleComplete} disabled={submitting} className="py-3 rounded-xl bg-accent2 text-white text-[12px] font-black uppercase tracking-widest shadow-md hover:bg-accent transition-all">Confirm</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmComplete(true)} className="w-full py-4 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[13px] shadow-premium hover:bg-ink transition-all">
                          Release Payment
                        </button>
                      )}
                    </div>
                  )}

                  {(booking.booking_status === 'pending' || booking.booking_status === 'accepted') && (
                    <div className="space-y-4">
                      {confirmCancel ? (
                        <div className="p-6 rounded-2xl bg-white border-2 border-red animate-in scale-in">
                          <h3 className="text-[14px] font-black uppercase tracking-widest text-red mb-2">Abort Order?</h3>
                          <p className="text-[12px] text-mid font-medium mb-6 leading-relaxed">Are you sure? Full refund will be initiated to your source payment.</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmCancel(false)} className="py-3 rounded-xl border border-rule text-[12px] font-black uppercase tracking-widest text-muted hover:bg-bg">Back</button>
                            <button onClick={handleCancel} disabled={submitting} className="py-3 rounded-xl bg-red text-white text-[12px] font-black uppercase tracking-widest shadow-md hover:bg-red/90 transition-all">Abort</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmCancel(true)} className="w-full py-3 rounded-xl border-2 border-rule text-[12px] font-black uppercase tracking-widest text-muted hover:border-red hover:text-red transition-all">
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  )}

                  {/* Review Flow */}
                  {booking.booking_status === 'completed' && !booking.has_review && (
                    <div className="bg-white rounded-3xl p-8 border border-rule shadow-premium animate-in slide-up">
                      <h2 className="text-[14px] font-black uppercase tracking-widest text-ink mb-2">Quality Review</h2>
                      <p className="text-[12px] text-mid font-medium mb-6">How was your service experience?</p>
                      <form onSubmit={handleReviewSubmit} className="space-y-6">
                        <StarRating value={rating} onChange={setRating} />
                        <textarea
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          rows={3}
                          placeholder="Your feedback helps maintaining quality..."
                          className="w-full px-4 py-4 rounded-xl bg-bg border border-rule text-[13px] font-medium outline-none focus:border-accent2 transition-all resize-none shadow-inner-soft"
                        />
                        <button
                          type="submit"
                          disabled={submittingReview || booking?.has_review}
                          className="w-full py-4 rounded-xl bg-accent2 text-white text-[13px] font-black uppercase tracking-widest shadow-md hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingReview ? 'Submitting Feedback...' : 'Submit Feedback'}
                        </button>
                      </form>
                    </div>
                  )}

                  {booking.booking_status === 'completed' && booking.has_review && (
                    <div className="bg-gbg/40 border border-green/10 rounded-3xl p-8 text-center animate-in fade-in">
                       <div className="w-10 h-10 bg-gbg text-green rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       </div>
                       <p className="text-green font-black uppercase tracking-widest text-[11px]">Feedback Submitted</p>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
