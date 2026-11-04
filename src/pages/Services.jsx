import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

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

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchServices = () => {
    setError('');
    api.get('/services')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setServices(res.data.data);
        }
      })
      .catch(() => {
        // keep default services
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg pb-24">
      {/* ── HEADER ── */}
      <header className="border-b border-rule bg-white py-16 px-6 lg:px-12 mb-12 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ap border border-accent2/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent2"></span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-accent">Service Catalogue</span>
          </div>
          <h1 className="font-display text-[48px] md:text-[64px] font-black text-ink tracking-tight leading-[0.95] mb-6">
            What do you need <br />
            <span className="text-accent2 italic font-medium">fixed today?</span>
          </h1>
          <p className="text-mid text-[16px] max-w-lg font-medium leading-relaxed">
            Select from our curated list of verified services. Reliable hands for every home project.
          </p>
          
          <div className="mt-10 relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services (e.g. Plumbing, Electrical...)"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-bg border border-rule text-ink text-[15px] placeholder-muted outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all shadow-inner-soft"
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-ap/30 -skew-x-12 translate-x-1/2"></div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Error State */}
        {error && (
          <div className="mb-10 p-6 rounded-2xl bg-rbg border border-red/20 flex flex-col items-center justify-center text-center animate-in fade-in">
            <p className="text-red font-bold text-[15px] mb-4">{error}</p>
            <button onClick={fetchServices} className="px-6 py-2 bg-red text-white font-bold rounded-lg hover:bg-red/90 transition-all shadow-sm">
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Grid */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ServiceSkeleton key={i} />)}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && search && (
          <div className="text-center py-32 animate-in slide-up">
            <div className="w-20 h-20 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-mid text-lg font-bold mb-2">No services found for &quot;{search}&quot;</p>
            <button onClick={() => setSearch('')} className="text-accent2 font-bold hover:underline uppercase text-[12px] tracking-widest">
              Clear search filter
            </button>
          </div>
        )}

        {/* Service Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((svc, i) => (
              <div
                key={svc.id}
                onClick={() => navigate(`/services/${svc.slug}`)}
                className="group relative p-8 rounded-2xl border border-rule bg-white hover:border-accent2 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[240px]"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <p className="font-mono text-[10px] font-bold text-accent2">S/{String(i+1).padStart(3, '0')}</p>
                </div>
                
                <div>
                  <div className="w-10 h-10 rounded-lg bg-bg2 flex items-center justify-center text-mid group-hover:bg-accent2 group-hover:text-white transition-all mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <h3 className="font-display text-[24px] font-bold text-ink mb-3 group-hover:text-accent2 transition-colors">
                    {svc.name}
                  </h3>
                  <p className="text-mid text-[14px] leading-relaxed mb-6 line-clamp-2 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                    {svc.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-accent text-[12px] font-bold uppercase tracking-widest translate-x-[-10px] group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  View
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
