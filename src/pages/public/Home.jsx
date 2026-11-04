import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';

const STATS = [
  { value: '2,400+', label: 'Verified Thekedars', accent: true },
  { value: '18k+', label: 'Jobs Completed', accent: false },
  { value: '4.8★', label: 'Average Rating', accent: true },
  { value: '47m', label: 'Avg Response', accent: false },
];

const HOW_STEPS = [
  { num: '01', title: 'Choose Service', desc: 'Browse categories and pick the service you need — plumbing, electrical, painting and more.' },
  { num: '02', title: 'See Nearby Thekedars', desc: 'View ratings, rates and experience of local contractors offering your selected service.' },
  { num: '03', title: 'Book & Pay', desc: 'Share your address, pay securely via escrow. Your payment is held until the job is done.' },
  { num: '04', title: 'Rate Your Karigar', desc: 'Workers arrive, you share the OTP to confirm arrival. After completion, rate your experience.' },
];

const TICKER_ITEMS = [
  'Plumbing Available',
  'Painters Ready',
  'Electricians Online',
  'Carpenters Near You',
  'Verified Electricians',
  '24/7 Support',
];

function ServiceSkeleton() {
  return (
    <div className="animate-pulse p-8 bg-white border border-rule/30 rounded-xl">
      <div className="h-3 w-12 bg-bg3 rounded mb-4" />
      <div className="h-7 w-32 bg-bg3 rounded mb-3" />
      <div className="h-4 w-full bg-bg3 rounded mb-2" />
      <div className="h-4 w-2/3 bg-bg3 rounded" />
    </div>
  );
}

const DEFAULT_SERVICES = [
  { id: '21bf4164-ddd2-417b-86b2-df3b1d7e3876', slug: 'plumbing', name: 'Plumbing', description: 'Pipe fitting, leakage repair, tap, drain cleaning' },
  { id: 'd4c34d38-ac78-4379-91a1-4bdc78481cd3', slug: 'painting', name: 'Wall Painting', description: 'Interior, exterior, texture, waterproofing coats' },
  { id: '0fedf85a-9b79-4d9b-bd5f-25e04038f087', slug: 'electrical', name: 'Electrical', description: 'Wiring, switchboard, fan, light fitting, MCB work' },
  { id: '9e24a525-f6d7-471c-ab06-c0975e01c5f5', slug: 'putty-plaster', name: 'Putty & Plaster', description: 'Wall putty, ceiling plaster, crack filling' },
  { id: '8ab7844b-ad2a-4116-a3db-8cb2423ce8bd', slug: 'tiling', name: 'Tile Installation', description: 'Floor, bathroom, kitchen tiles' },
  { id: 'e45a03bf-3536-4d8e-880e-4a9baadb17ea', slug: 'carpentry', name: 'Carpentry', description: 'Doors, windows, furniture assembly, shelves' },
  { id: '14d10d49-844f-46bb-9624-87c8fcde7ce8', slug: 'waterproofing', name: 'Waterproofing', description: 'Terrace, bathroom, basement waterproofing' },
  { id: '455c53f8-d5f8-4123-9ce3-9fbf5a384955', slug: 'cleaning', name: 'Deep Cleaning', description: 'Full home cleaning, sofa, carpet, kitchen' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/services')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setServices(res.data.data);
        }
      })
      .catch(() => {
        // Keep default services as fallback
      });
  }, []);

  return (
    <div className="bg-bg min-h-screen font-sans text-ink">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-rule">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] min-h-[85vh]">
          {/* LEFT: Content */}
          <div className="flex flex-col justify-center px-6 py-16 lg:px-12 lg:py-24 border-r border-rule relative">
            <div className="absolute top-12 left-12 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ap border border-accent2/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-accent2 animate-pulse"></span>
                <span className="text-[11px] font-bold tracking-widest uppercase text-accent">India&apos;s Labour Marketplace</span>
              </div>
              
              <h1 className="font-display font-black leading-[0.9] tracking-tight text-ink mb-8" style={{ fontSize: 'clamp(56px, 8vw, 104px)' }}>
                Skilled <span className="text-accent2 italic font-medium">hands</span>,
                <br />
                one tap away.
              </h1>
              
              <p className="text-[18px] md:text-[20px] text-mid mb-10 leading-relaxed max-w-lg font-medium">
                Find verified local contractors for plumbing, electrical, and more. 
                <span className="text-ink"> Skilled labor, simplified.</span>
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/services')}
                  className="px-8 py-4 bg-accent text-white font-bold rounded-lg shadow-premium hover:shadow-premium-hover hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-2"
                >
                  Book a Service
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
                {!user && (
                  <button
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 bg-white border border-rule text-ink font-bold rounded-lg hover:border-ink hover:bg-bg2 transition-all"
                  >
                    Become a Thekedar
                  </button>
                )}
              </div>
            </div>

            <div className="mt-20 pt-8 border-t border-rule/50 flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-bg3 flex items-center justify-center text-[10px] font-bold text-mid`}>
                    K{i}
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-mid font-medium">
                Joined by over <span className="text-ink font-bold">5,000+</span> thekedars this month.
              </p>
            </div>
          </div>

          {/* RIGHT: Stats */}
          <aside className="hidden lg:flex flex-col bg-white">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 px-12 flex flex-col justify-center border-b border-rule group hover:bg-bg2 transition-colors cursor-default`}
              >
                <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted mb-3 group-hover:text-accent2 transition-colors">
                  {s.label}
                </p>
                <p className={`font-display text-[48px] font-black tracking-tight leading-none ${s.accent ? 'text-accent' : 'text-ink'}`}>
                  {s.value}
                </p>
              </div>
            ))}
            <div className="p-10 bg-accent text-white flex flex-col justify-center gap-4">
              <p className="text-[13px] font-medium opacity-80 italic">"The most reliable way to find workers in Bangalore."</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20"></div>
                <p className="text-[11px] font-bold uppercase tracking-wider">Rahul M. • Homeowner</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ── TICKER STRIP ── */}
      <div className="bg-ink overflow-hidden border-b border-ink relative group">
        <div className="flex whitespace-nowrap animate-[scroll_30s_linear_infinite] group-hover:[animation-play-state:paused]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="inline-flex items-center gap-4 px-12 py-5 border-r border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2"></span>
              <span className="text-white text-[13px] font-bold tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section className="bg-white border-b border-rule overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row">
          {/* Left Intro */}
          <div className="lg:w-[400px] p-12 lg:p-20 border-r border-rule flex flex-col justify-between bg-bg2/30">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent2 mb-6">Expertise</p>
              <h2 className="font-display text-[48px] font-black tracking-tighter leading-[0.95] text-ink mb-6">
                Tailored <br/>Expert <br/>Services
              </h2>
              <p className="text-[15px] leading-relaxed text-mid font-medium">
                Hand-picked, verified contractors for every home need. From minor repairs to major renovations.
              </p>
            </div>
            <button
              onClick={() => navigate('/services')}
              className="mt-12 self-start px-6 py-3 bg-ink text-white text-[13px] font-bold rounded-lg hover:bg-accent transition-all shadow-premium"
            >
              Explore Catalogue
            </button>
          </div>

          {/* Right Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-8 border-r border-b border-rule/50">
                  <ServiceSkeleton />
                </div>
              ))
            ) : error ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-rbg rounded-full flex items-center justify-center text-red mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <p className="text-mid font-medium mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-rule text-ink font-bold rounded-full hover:bg-bg3 transition-all">
                  Try Again
                </button>
              </div>
            ) : (
              services.map((svc, i) => (
                <div
                  key={svc.id}
                  onClick={() => navigate(`/services/${svc.slug}`)}
                  className="group relative p-10 border-r border-b border-rule/50 bg-white hover:bg-bg transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-0 bg-accent group-hover:h-full transition-all duration-500"></div>
                  <p className="font-mono text-[11px] font-bold text-muted mb-6 group-hover:text-accent transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="font-display text-[26px] font-bold tracking-tight text-ink mb-4 group-hover:-translate-y-1 transition-transform duration-500">
                    {svc.name}
                  </h3>
                  <p className="text-[14px] text-mid leading-relaxed mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                    {svc.description}
                  </p>
                  <div className="flex items-center gap-2 text-accent font-bold text-[12px] uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                    Get Started
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border-b border-rule">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`p-12 border-r border-b md:border-b-0 border-rule/60 group hover:bg-bg2 transition-all duration-300`}
            >
              <div className="w-16 h-16 bg-bg2 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-accent group-hover:text-white transition-all duration-500 shadow-inner-soft">
                <span className="font-display text-[24px] font-black">{step.num}</span>
              </div>
              <h3 className="font-display text-[20px] font-bold text-ink mb-4">{step.title}</h3>
              <p className="text-[14px] text-mid leading-relaxed font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
