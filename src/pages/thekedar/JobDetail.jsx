import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import ToastContext from '../../context/ToastContext';
import { formatCurrency, formatDate, maskName } from '../../utils/formatters';

function StatusBadge({ status }) {
  const styles = {
    pending: { bg: 'bg-goldbg', text: 'text-gold', border: 'border-gold/10' },
    accepted: { bg: 'bg-bluebg', text: 'text-blue', border: 'border-blue/10' },
    dispatched: { bg: 'bg-gbg', text: 'text-green', border: 'border-green/10' },
    in_progress: { bg: 'bg-ap', text: 'text-accent', border: 'border-accent/10' },
    completed: { bg: 'bg-gbg', text: 'text-green', border: 'border-green/10' },
    cancelled: { bg: 'bg-rbg', text: 'text-red', border: 'border-red/10' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

const STATUS_STEPS = ['pending', 'accepted', 'dispatched', 'in_progress', 'completed'];
const STEP_LABELS = {
  pending: 'Booked',
  accepted: 'Accepted',
  dispatched: 'Dispatched',
  in_progress: 'In Progress',
  completed: 'Completed',
};

// ── OTP Display Box (Security Vault) ──────────────────────────────────────────
function OtpDisplayBox({ otp }) {
  if (!otp) return null;
  return (
    <div className="rounded-3xl p-8 mb-8 text-center bg-white border border-rule shadow-premium relative overflow-hidden group animate-in scale-in">
      <div className="absolute top-0 left-0 w-full h-1 bg-accent2"></div>
      <div className="flex items-center justify-center gap-2 mb-6">
        <svg className="w-5 h-5 text-accent2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ink">Secure Dispatch Code</p>
      </div>
      <div className="flex justify-center gap-3 mb-6">
        {otp.split('').map((d, i) => (
          <div key={i}
            className="w-16 h-20 rounded-2xl flex items-center justify-center text-4xl font-display font-black bg-bg border-2 border-rule text-accent group-hover:border-accent2 transition-colors shadow-inner-soft">
            {d}
          </div>
        ))}
      </div>
      <p className="text-[13px] font-medium text-mid leading-relaxed max-w-xs mx-auto">
        Share this unique code with your worker <span className="text-ink font-bold">to verify arrival</span> at the customer's location.
      </p>
    </div>
  );
}

// ── Dispatch Modal ───────────────────────────────────────────
function DispatchModal({ booking, workers, onClose, onDispatch }) {
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useContext(ToastContext);
  const needed = booking?.workers_needed || 1;

  const handleToggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
    setError('');
  };

  const handleDispatch = async () => {
    if (selected.length !== needed) {
      setError(`Select exactly ${needed} worker${needed > 1 ? 's' : ''} (${selected.length} selected)`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put(`/bookings/${booking.id}/dispatch`, { workerIds: selected });
      if (res.data.success) {
        showToast('Workers dispatched!', 'success');
        onDispatch(res.data.data);
        onClose();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to dispatch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-sm bg-ink/60 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-premium border border-rule animate-in slide-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-[24px] font-display font-black text-ink tracking-tight leading-none">Assemble Team</h3>
            <p className="text-muted text-[13px] font-medium mt-2">Deploy {needed} specialist{needed > 1 ? 's' : ''} for this order.</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="space-y-3 mb-8 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          {workers.length === 0 ? (
            <div className="p-6 text-center bg-bg rounded-2xl border border-rule">
              <p className="text-mid font-medium text-[13px] mb-3">You don't have any workers in your team yet.</p>
              <Link to="/thekedar/workers" className="px-5 py-2.5 bg-accent text-white font-bold text-[12px] rounded-xl inline-block hover:shadow-md transition-all">
                Add Labour in Team
              </Link>
            </div>
          ) : (
            workers.map(w => {
              const isSelected = selected.includes(w.id);
              const skillsDisplay = Array.isArray(w.skills)
                ? w.skills.map(s => String(s).replace(/[{}]/g, '')).filter(Boolean).join(' • ')
                : (w.skills ? String(w.skills).replace(/[{}]/g, '') : '');
              return (
                <button
                  key={w.id}
                  onClick={() => handleToggle(w.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all group ${
                    isSelected
                      ? 'border-accent2 bg-ap shadow-inner-soft'
                      : 'border-rule bg-white hover:border-muted hover:bg-bg'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? 'border-accent2 bg-accent2' : 'border-rule bg-bg'
                  }`}>
                    {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-ink">{w.name}</p>
                    <p className="text-[11px] text-muted font-bold uppercase tracking-widest">
                      {skillsDisplay || 'Labour / Specialist'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rbg border border-red/20 text-red text-[12px] font-bold text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        <button
          onClick={handleDispatch}
          disabled={submitting}
          className="w-full py-4.5 bg-accent text-white text-[15px] font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all disabled:opacity-50"
        >
          {submitting ? 'Deploying...' : 'Confirm Dispatch'}
        </button>
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const [booking, setBooking] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [dispatchModal, setDispatchModal] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/bookings/${id}`),
      api.get('/workers'),
    ]).then(([bRes, wRes]) => {
      if (bRes.data.success) setBooking(bRes.data.data);
      if (wRes.data.success) setWorkers(wRes.data.data || []);
    }).catch(() => showToast('Failed to load booking', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await api.put(`/bookings/${id}/accept`);
      if (res.data.success) {
        setBooking(res.data.data);
        showToast('Booking accepted! OTP generated.', 'success');
      }
    } catch {
      showToast('Failed to accept', 'error');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      const res = await api.put(`/bookings/${id}/reject`);
      if (res.data.success) {
        showToast('Booking declined', 'info');
        navigate('/thekedar/jobs');
      }
    } catch {
      showToast('Failed to decline', 'error');
    } finally {
      setDeclining(false);
    }
  };

  const handleDispatch = (updatedBooking) => {
    setBooking(updatedBooking);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg pt-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent2 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[12px] font-bold text-muted uppercase tracking-[0.2em]">Syncing Operations...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-bg pt-12 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl border border-rule shadow-premium text-center">
          <p className="text-ink font-bold text-lg mb-4">Job data not available.</p>
          <button onClick={() => navigate('/thekedar/jobs')} className="text-accent2 font-bold hover:underline uppercase text-[12px] tracking-widest">Return to List</button>
        </div>
      </div>
    );
  }

  const serviceName = booking.service?.name || 'Service';
  const currentStepIdx = STATUS_STEPS.indexOf(booking.booking_status);

  return (
    <div className="pb-32 animate-in slide-up">
      {/* ── HEADER ── */}
      <nav className="mb-10 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted">
        <Link to="/thekedar/dashboard" className="hover:text-accent transition-colors">Overview</Link>
        <span className="opacity-30">/</span>
        <Link to="/thekedar/jobs" className="hover:text-accent transition-colors">Jobs</Link>
        <span className="opacity-30">/</span>
        <span className="text-ink">#{id.slice(-6).toUpperCase()}</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <StatusBadge status={booking.booking_status} />
            <span className="text-[11px] font-bold text-muted tabular-nums">Ref: {id.toUpperCase()}</span>
          </div>
          <h1 className="font-display text-[48px] font-black text-ink tracking-tight leading-none mb-2">
            {serviceName}
          </h1>
          <p className="text-mid font-medium flex items-center gap-2">
            Customer: <span className="text-ink font-bold">{maskName(booking.consumer_name)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
           <a href={`tel:+919800000000`} className="p-4 bg-white border border-rule rounded-2xl text-muted hover:text-accent2 transition-all shadow-sm">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
           </a>
        </div>
      </div>

      {/* ── TIMELINE ── */}
      <div className="bg-white rounded-3xl p-8 border border-rule shadow-premium mb-10">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
        <div className="space-y-10">
          {/* OTP Vault Interaction */}
          {(booking.booking_status === 'accepted' || booking.booking_status === 'dispatched') && booking.otp && (
            <OtpDisplayBox otp={booking.otp} />
          )}

          {/* Status Specific Banners */}
          {booking.booking_status === 'dispatched' && (
            <div className="bg-bluebg/20 border border-blue/10 rounded-3xl p-8 flex items-center gap-6 animate-in slide-up">
              <div className="w-16 h-16 bg-bluebg text-blue rounded-2xl flex items-center justify-center shrink-0 shadow-inner-soft">
                 <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              </div>
              <div>
                <h3 className="text-blue font-black uppercase tracking-widest text-[14px] mb-1">Team En Route</h3>
                <p className="text-mid text-[13px] font-medium leading-relaxed">
                  The team has been dispatched. They must present the secure code to the customer upon arrival.
                </p>
              </div>
            </div>
          )}

          {booking.booking_status === 'in_progress' && (
            <div className="bg-gbg/40 border border-green/10 rounded-3xl p-8 flex items-center gap-6 animate-in scale-in">
              <div className="w-16 h-16 bg-gbg text-green rounded-2xl flex items-center justify-center shrink-0 shadow-inner-soft">
                 <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h3 className="text-green font-black uppercase tracking-widest text-[14px] mb-1">Session Active</h3>
                <p className="text-mid text-[13px] font-medium leading-relaxed">
                  Arrival verified. The labor force is currently engaged at the job site.
                </p>
              </div>
            </div>
          )}

          {/* Job Specifications */}
          <div className="bg-white rounded-3xl p-10 border border-rule shadow-premium space-y-10">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Service Specifications</h2>
            
            <div className="grid grid-cols-2 gap-10">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Scheduled Commencement</p>
                <p className="text-[16px] font-bold text-ink">{booking.scheduled_at ? formatDate(booking.scheduled_at) : 'Immediate Action'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Deployed Force</p>
                <p className="text-[16px] font-bold text-ink">{booking.workers_needed} Worker{booking.workers_needed > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="pt-8 border-t border-rule/50">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Operational Location</p>
              {booking.address ? (
                <div className="p-6 rounded-2xl bg-bg border border-rule/50 flex items-start gap-4">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  <p className="text-[14px] font-medium text-ink leading-relaxed">
                    {booking.address.address_line1}, {booking.address.city}<br/>
                    {booking.address.state} {booking.address.postal_code}
                  </p>
                </div>
              ) : (
                <p className="text-mid font-italic">Address details shared upon acceptance.</p>
              )}
            </div>

            <div className="pt-8 border-t border-rule/50">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Job Brief</p>
              <div className="p-6 rounded-2xl bg-bg border border-rule/50 italic text-[14px] font-medium text-mid leading-relaxed">
                &quot;{booking.job_description || 'No detailed brief provided.'}&quot;
              </div>
            </div>
          </div>

          {/* Team Members */}
          {(booking.booking_status === 'dispatched' || booking.booking_status === 'in_progress' || booking.booking_status === 'completed') && booking.assigned_workers?.length > 0 && (
            <div className="bg-white rounded-3xl p-10 border border-rule shadow-premium">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-8">Deployed Personnel</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.assigned_workers.map(w => (
                  <div key={w.id} className="flex items-center gap-4 p-5 rounded-2xl bg-bg border border-rule/50 group transition-all">
                    <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center font-display font-black text-lg">
                      {w.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-ink">{w.name}</p>
                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
                        {Array.isArray(w.skills) ? w.skills.slice(0, 2).join(' • ') : w.skills}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ACTIONS ── */}
        <aside className="sticky top-12 space-y-8">
          {/* Financial Overview */}
          <div className="bg-ink text-white rounded-3xl p-8 shadow-premium overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent2/10 rounded-full blur-2xl -z-0"></div>
            <div className="relative z-10 space-y-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Settlement Amount</p>
                <p className="text-[32px] font-display font-black tabular-nums">{formatCurrency(booking.thekedar_payout)}</p>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center text-[13px] font-medium opacity-60">
                  <span>Gross Order</span>
                  <span className="tabular-nums">{formatCurrency(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] font-medium opacity-60">
                  <span>Platform Fee</span>
                  <span className="tabular-nums">-{formatCurrency(booking.platform_fee)}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                   <span className="text-[11px] font-black uppercase tracking-widest">Payout Status</span>
                   <span className="text-accent2 text-[11px] font-black uppercase tracking-widest">{booking.payment_status?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {booking.booking_status === 'pending' && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full py-5 bg-accent text-white font-display font-black text-[15px] uppercase tracking-widest rounded-2xl shadow-premium hover:shadow-premium-hover hover:bg-ink transition-all disabled:opacity-50"
                >
                  {accepting ? 'Accepting...' : 'Accept Booking'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declining}
                  className="w-full py-4 border-2 border-rule text-red text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-rbg transition-all disabled:opacity-50"
                >
                  {declining ? 'Declining...' : 'Decline Job'}
                </button>
              </>
            )}

            {booking.booking_status === 'accepted' && (
              <button
                onClick={() => setDispatchModal(true)}
                className="w-full py-5 bg-accent2 text-white font-display font-black text-[15px] uppercase tracking-widest rounded-2xl shadow-premium hover:shadow-premium-hover hover:bg-accent transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Dispatch Team
              </button>
            )}

            {booking.booking_status === 'completed' && booking.review && (
              <div className="bg-white rounded-3xl p-8 border border-rule shadow-premium animate-in slide-up">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted mb-4">Customer Review</h3>
                <div className="flex text-accent2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < booking.review.rating ? 'fill-current' : 'opacity-20'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  ))}
                </div>
                <p className="text-[14px] font-medium text-mid leading-relaxed italic">&quot;{booking.review.comment}&quot;</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Dispatch Modal */}
      {dispatchModal && (
        <DispatchModal
          booking={booking}
          workers={workers}
          onClose={() => setDispatchModal(false)}
          onDispatch={handleDispatch}
        />
      )}
    </div>
  );
}
