import { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import ToastContext from '../../context/ToastContext';

const navItems = [
  { label: 'Overview', to: '/thekedar/dashboard', icon: 'grid' },
  { label: 'Jobs', to: '/thekedar/jobs', icon: 'clipboard' },
  { label: 'Labour / Workers', to: '/thekedar/workers', icon: 'users' },
  { label: 'Earnings', to: '/thekedar/earnings', icon: 'dollar' },
  { label: 'Settings', to: '/thekedar/profile', icon: 'user' },
];

function NavIcon({ name }) {
  const icons = {
    grid: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    clipboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
    ),
    users: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    dollar: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    user: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    logout: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  };
  return icons[name] || null;
}

export default function ThekedarLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(user?.is_online ?? false);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.get('/thekedars/me');
        if (res.data.success) {
          const profile = res.data.data;
          if (!profile.bio && !profile.location && !profile.rate_per_hour) {
            navigate('/thekedar/complete-profile');
          }
        }
      } catch (err) {
        console.error('Failed to check profile', err);
      }
    };
    if (user && user.role === 'thekedar' && location.pathname !== '/thekedar/complete-profile') {
      checkProfile();
    }
  }, [user, location.pathname, navigate]);

  const handleAvailabilityToggle = async () => {
    const newStatus = !isOnline;
    try {
      const res = await api.put('/thekedars/me/availability', { is_online: newStatus });
      if (res.data.success) {
        setIsOnline(newStatus);
        showToast(newStatus ? 'Status: Online' : 'Status: Offline', 'success');
      }
    } catch {
      showToast('Status update failed', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-bg2/40">
      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 bg-white border-r border-rule relative">
        {/* Branding & User Profile */}
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-10 group">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-display font-black text-lg group-hover:scale-110 transition-transform shadow-premium">
              K
            </div>
            <span className="font-display text-[18px] font-bold tracking-tight text-ink">KarigarNow</span>
          </Link>

          <div className="bg-bg rounded-2xl p-4 border border-rule/50 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent2 text-white flex items-center justify-center font-display font-black text-sm shadow-inner">
                {user?.name?.charAt(0) || 'T'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[14px] text-ink truncate">{user?.name || 'Contractor'}</p>
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Thekedar</p>
              </div>
            </div>

            {/* Availability Switch */}
            <button
              onClick={handleAvailabilityToggle}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                isOnline ? 'bg-ap border border-accent2/20' : 'bg-bg3/30 border border-transparent'
              }`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isOnline ? 'text-accent' : 'text-muted'}`}>
                {isOnline ? 'Status: Online' : 'Status: Offline'}
              </span>
              <div className={`w-8 h-4.5 rounded-full relative transition-colors ${isOnline ? 'bg-accent2' : 'bg-muted/40'}`}>
                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${isOnline ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => {
            const active = isActive(item.to);
            return (
              <div key={item.to} className="flex items-center gap-1">
                <Link
                  to={item.to}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-xl transition-all duration-200 ${
                    active 
                      ? 'bg-ink text-white shadow-premium' 
                      : 'text-mid hover:text-ink hover:bg-bg'
                  }`}
                >
                  <span className={`${active ? 'text-accent2' : 'text-muted group-hover:text-ink'}`}>
                    <NavIcon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
                {item.to === '/thekedar/workers' && (
                  <Link
                    to="/thekedar/workers?add=true"
                    title="Add Labour"
                    className="p-2.5 rounded-xl bg-ap hover:bg-accent hover:text-white text-accent2 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-rule">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-red hover:bg-rbg transition-all"
          >
            <NavIcon name="logout" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        {/* Top Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent pointer-events-none -z-10"></div>
        
        <div className="max-w-[1200px] mx-auto p-6 md:p-12 pb-32">
          {/* Dashboard Header Placeholder (usually managed in children, but giving layout structure) */}
          <div className="animate-in slide-up">
            {children}
          </div>
        </div>
      </main>

      {/* ── MOBILE NAV ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-rule flex items-center overflow-x-auto scrollbar-hide py-3 px-6 z-[400] shadow-premium gap-8">
        {navItems.map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 shrink-0 transition-all ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              <div className={`${active ? 'scale-110' : ''} transition-transform`}>
                <NavIcon name={item.icon} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 shrink-0 text-muted hover:text-red transition-all"
        >
          <NavIcon name="logout" />
          <span className="text-[10px] font-black uppercase tracking-widest">Exit</span>
        </button>
      </div>
    </div>
  );
}
