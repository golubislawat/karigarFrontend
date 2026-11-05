import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import ToastContext from '../../context/ToastContext';
import { formatCurrency, formatDate, maskName, isToday, isThisWeek } from '../../utils/formatters';

function StatCard({ label, value, accent, subtext }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-rule/50 shadow-premium hover:shadow-premium-hover transition-all group flex flex-col justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-4 group-hover:text-accent2 transition-colors">
          {label}
        </p>
        <p className={`text-[32px] font-black tracking-tight tabular-nums leading-none ${accent ? 'text-accent2' : 'text-ink'}`}>
          {value}
        </p>
      </div>
      {subtext && (
        <p className="text-[11px] font-medium text-muted mt-3">
          {subtext}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: { bg: 'bg-goldbg', text: 'text-gold', dot: 'bg-gold' },
    accepted: { bg: 'bg-bluebg', text: 'text-blue', dot: 'bg-blue' },
    dispatched: { bg: 'bg-gbg', text: 'text-green', dot: 'bg-green' },
    in_progress: { bg: 'bg-ap', text: 'text-accent', dot: 'bg-accent' },
    completed: { bg: 'bg-gbg', text: 'text-green', dot: 'bg-green' },
    cancelled: { bg: 'bg-rbg', text: 'text-red', dot: 'bg-red' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`}></span>
      {status?.replace('_', ' ')}
    </span>
  );
}

function RequestCard({ booking, onAccept, onDecline }) {
  const [accepted, setAccepted] = useState(false);
  const [acceptedBooking, setAcceptedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useContext(ToastContext);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/bookings/${booking.id}/accept`);
      if (res.data.success) {
        setAcceptedBooking(res.data.data);
        setAccepted(true);
        showToast(`Job accepted! OTP generated.`, 'success');
        onAccept(booking.id, res.data.data);
      }
    } catch {
      showToast('Failed to accept booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/bookings/${booking.id}/reject`);
      if (res.data.success) {
        showToast('Booking declined', 'info');
        onDecline(booking.id);
      }
    } catch {
      showToast('Failed to decline booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayBooking = acceptedBooking || booking;
  const serviceName = displayBooking.service?.name || booking.service?.name || 'Service';
  const area = displayBooking.address?.city || booking.address?.city || '';

  return (
    <div className="bg-white rounded-2xl border border-rule/60 p-6 shadow-premium relative overflow-hidden group">
      {accepted && acceptedBooking ? (
        <div className="text-center py-6 animate-in scale-in">
          <div className="w-12 h-12 bg-gbg text-green rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <p className="text-[14px] font-bold text-ink mb-1">Job Accepted Successfully!</p>
          <p className="text-[12px] text-mid font-medium max-w-[260px] mx-auto mb-3 leading-relaxed">
            Arrival verification OTP has been emailed to the customer.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ap text-accent text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            Verify OTP upon arrival at site
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-display text-[18px] font-bold text-ink leading-tight mb-1">{maskName(booking.consumer_name)}</h3>
              <p className="text-[13px] font-bold text-accent2 uppercase tracking-wider">{serviceName}</p>
            </div>
            <StatusBadge status={booking.booking_status} />
          </div>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-mid">
               <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               <span className="text-[13px] font-medium">{area || 'Location shared on accept'}</span>
            </div>
            <div className="flex items-center gap-3 text-mid">
               <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               <span className="text-[13px] font-medium">{booking.scheduled_at ? formatDate(booking.scheduled_at) : 'Immediate'}</span>
            </div>
            <div className="flex items-center gap-3 text-mid">
               <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               <span className="text-[13px] font-bold text-ink tabular-nums">{formatCurrency(booking.total_amount)} <span className="text-[10px] text-muted font-bold uppercase tracking-widest ml-1">Est. Payout</span></span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-[2] py-3 rounded-xl bg-accent text-white text-[13px] font-bold shadow-sm hover:shadow-md hover:bg-ink active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Accept Job'}
            </button>
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-rule text-red text-[13px] font-bold hover:bg-rbg transition-all disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ActiveJobCard({ booking }) {
  const navigate = useNavigate();
  const serviceName = booking.service?.name || 'Service';

  return (
    <div className="bg-white rounded-2xl border border-rule/60 p-6 shadow-premium hover:shadow-premium-hover transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-display text-[17px] font-bold text-ink leading-tight mb-1">{maskName(booking.consumer_name)}</h3>
          <p className="text-[12px] font-bold text-accent2 uppercase tracking-widest">{serviceName}</p>
        </div>
        <StatusBadge status={booking.booking_status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-bg2/50 rounded-xl border border-rule/30">
           <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Scheduled</p>
           <p className="text-[12px] font-bold text-ink truncate">{booking.scheduled_at ? formatDate(booking.scheduled_at) : 'ASAP'}</p>
        </div>
        <div className="p-3 bg-bg2/50 rounded-xl border border-rule/30">
           <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Payout</p>
           <p className="text-[12px] font-bold text-accent tabular-nums truncate">{formatCurrency(booking.total_amount)}</p>
        </div>
      </div>

      {booking.booking_status === 'accepted' && (
        <button
          onClick={() => navigate(`/thekedar/jobs/${booking.id}`)}
          className="w-full py-3 bg-accent text-white text-[13px] font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-ink transition-all flex items-center justify-center gap-2 mb-4"
        >
          Dispatch Workers
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
        </button>
      )}

      {/* Button to view details for non-accepted statuses */}
      {booking.booking_status !== 'accepted' && (
        <button
          onClick={() => navigate(`/thekedar/jobs/${booking.id}`)}
          className="w-full py-3 bg-white border border-rule text-ink text-[13px] font-bold rounded-xl shadow-sm hover:bg-bg transition-all mb-4"
        >
          View Job Details
        </button>
      )}

      {(booking.booking_status === 'accepted' || booking.booking_status === 'dispatched') && (
        <div className="text-center pt-2">
          {booking.booking_status === 'accepted' ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-blue py-1.5 px-4 bg-bluebg rounded-full">
              Awaiting Worker Dispatch
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-green py-1.5 px-4 bg-gbg rounded-full">
              Workers Dispatched • Awaiting Customer OTP
            </span>
          )}
        </div>
      )}

      {booking.booking_status === 'in_progress' && (
        <div className="p-4 bg-ap/30 border border-accent/10 rounded-xl flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="text-[11px] font-bold text-accent uppercase tracking-widest">Job In Progress</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    Promise.all([
      api.get('/bookings?page=0&size=100'),
      api.get('/workers'),
      api.get('/thekedars/me'),
    ]).then(([bRes, wRes, pRes]) => {
      if (bRes.data.success) setBookings(bRes.data.data.content || []);
      if (wRes.data.success) setWorkers(wRes.data.data || []);
      if (pRes.data.success) setProfile(pRes.data.data);
    }).catch(() => {
      showToast('Failed to load dashboard data', 'error');
    }).finally(() => setLoading(false));
  }, []);

  const getPayout = (b) => {
    if (b.thekedar_payout != null && !isNaN(Number(b.thekedar_payout))) {
      return Number(b.thekedar_payout);
    }
    if (b.total_amount != null && !isNaN(Number(b.total_amount))) {
      return Number(b.total_amount) * 0.95;
    }
    return 0;
  };

  const pendingBookings = bookings.filter(b => b.booking_status === 'pending');
  const activeBookings = bookings.filter(b => ['accepted', 'dispatched', 'in_progress'].includes(b.booking_status));
  const completedBookings = bookings.filter(b => b.booking_status === 'completed');
  
  const totalEarned = completedBookings.reduce((sum, b) => sum + getPayout(b), 0);
  const todayEarnings = completedBookings
    .filter(b => (b.scheduled_at && isToday(b.scheduled_at)) || (b.created_at && isToday(b.created_at)))
    .reduce((sum, b) => sum + getPayout(b), 0);
  const weekJobs = completedBookings.filter(b => (b.scheduled_at && isThisWeek(b.scheduled_at)) || (b.created_at && isThisWeek(b.created_at)));
  const weekEarnings = weekJobs.reduce((sum, b) => sum + getPayout(b), 0);
  const liveRating = Number(profile?.rating_average ?? user?.rating_average ?? 5.0);

  const handleAccept = (id, updatedBooking) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedBooking, booking_status: 'accepted' } : b));
  };

  const handleDecline = (id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  // Availability Toggle
  const handleAvailabilityToggle = async () => {
    const newStatus = !user.is_online;
    try {
      const res = await api.put('/thekedars/me/availability', { is_online: newStatus });
      if (res.data.success) {
        // Optimistically update user context
        window.location.reload(); 
        showToast(newStatus ? 'Status: Online' : 'Status: Offline', 'success');
      }
    } catch {
      showToast('Status update failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-bg3 rounded-lg mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-rule/30" />
          ))}
        </div>
        <div className="h-8 w-32 bg-bg3 rounded-lg mt-12 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-rule/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in slide-up">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[40px] font-black text-ink tracking-tight leading-none mb-3">Overview</h1>
          <p className="text-mid font-medium flex items-center gap-2">
            Welcome back, <span className="text-ink font-bold">{user?.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent2"></span>
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Link 
             to="/thekedar/workers?add=true" 
             className="px-5 py-2.5 bg-accent text-white rounded-xl text-[13px] font-bold hover:bg-accent/90 transition-all shadow-premium flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
             + Add Labour
           </Link>
           <Link to="/thekedar/profile" className="px-5 py-2.5 bg-white border border-rule rounded-xl text-[13px] font-bold text-ink hover:bg-bg transition-all shadow-sm">
             Edit Profile
           </Link>
           <button onClick={() => window.location.reload()} className="p-2.5 bg-white border border-rule rounded-xl text-muted hover:text-ink transition-all shadow-sm" title="Refresh">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
           </button>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label={activeBookings.length > 0 ? "Active Operations" : "Jobs Completed"} 
          value={activeBookings.length > 0 ? activeBookings.length : (completedBookings.length || profile?.total_jobs || 0)}
          subtext={activeBookings.length > 0 ? `${completedBookings.length} completed all-time` : `${activeBookings.length} active right now`}
        />
        <StatCard 
          label="Pending Requests" 
          value={pendingBookings.length} 
          subtext={pendingBookings.length > 0 ? "Action required" : "All caught up"}
        />
        <StatCard 
          label="Total Revenue" 
          value={formatCurrency(totalEarned)} 
          accent 
          subtext={todayEarnings > 0 ? `${formatCurrency(todayEarnings)} today` : `${completedBookings.length} completed jobs`}
        />
        <StatCard 
          label="Live Rating" 
          value={`${liveRating.toFixed(1)} ★`} 
          subtext={`${completedBookings.length} client ratings`}
        />
      </div>

      {/* ── INCOMING REQUESTS ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-bold text-ink uppercase tracking-widest">New Job Requests</h2>
            {pendingBookings.length > 0 && <span className="px-2 py-0.5 bg-accent text-white text-[10px] font-black rounded-full animate-pulse">{pendingBookings.length}</span>}
          </div>
          <Link to="/thekedar/jobs" className="text-[12px] font-bold text-accent2 hover:underline uppercase tracking-widest">
            Manage All
          </Link>
        </div>
        
        {pendingBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-rule/50 shadow-premium">
            <div className="w-12 h-12 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-4 text-muted/40">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </div>
            <p className="text-[14px] text-mid font-medium italic">No new requests in your queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pendingBookings.slice(0, 3).map(booking => (
              <RequestCard
                key={booking.id}
                booking={booking}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── ACTIVE JOBS ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold text-ink uppercase tracking-widest">Live Operations</h2>
          <Link to="/thekedar/jobs" className="text-[12px] font-bold text-accent2 hover:underline uppercase tracking-widest">
            Operational History
          </Link>
        </div>
        
        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-rule/50 shadow-premium">
            <div className="w-12 h-12 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-4 text-muted/40">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-[14px] text-mid font-medium italic">No active operations at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeBookings.slice(0, 3).map(booking => (
              <ActiveJobCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      {/* ── QUICK METRICS ── */}
      <section className="bg-white rounded-3xl p-8 border border-rule/50 shadow-premium overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:bg-accent/10 transition-colors"></div>
        <h2 className="text-[18px] font-bold text-ink uppercase tracking-widest mb-8">Performance This Week</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Total Volume</p>
            <p className="text-[28px] font-black text-ink tabular-nums leading-none">{weekJobs.length || completedBookings.length || profile?.total_jobs || 0}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Weekly Earnings</p>
            <p className="text-[28px] font-black text-accent2 tabular-nums leading-none">{formatCurrency(weekEarnings || totalEarned)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Live Rating</p>
            <p className="text-[28px] font-black text-ink tabular-nums leading-none">{liveRating.toFixed(1)} ★</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Active Force</p>
            <p className="text-[28px] font-black text-ink tabular-nums leading-none">{workers.length}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
