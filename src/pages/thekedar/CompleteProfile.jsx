import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import ToastContext from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

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

export default function CompleteProfile() {
  const { user } = useAuth();
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [formData, setFormData] = useState({
    bio: '',
    experience: '',
    location: '',
    rate_per_hour: '',
  });
  const [selectedServices, setSelectedServices] = useState([]); // { service_id, custom_rate }

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const res = await api.get('/services');
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setServices(res.data.data);
      } else {
        setServices(DEFAULT_SERVICES);
      }
    } catch (err) {
      console.warn('Using default services list due to network latency:', err);
      setServices(DEFAULT_SERVICES);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.service_id === service.id);
      if (exists) {
        return prev.filter(s => s.service_id !== service.id);
      } else {
        return [...prev, { service_id: service.id, name: service.name, custom_rate: formData.rate_per_hour || '' }];
      }
    });
  };

  const handleServiceRateChange = (serviceId, rate) => {
    setSelectedServices(prev => 
      prev.map(s => s.service_id === serviceId ? { ...s, custom_rate: rate } : s)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bio || !formData.location || !formData.rate_per_hour) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (selectedServices.length === 0) {
      showToast('Please select at least one service', 'error');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Update profile
      await api.put('/thekedars/me', {
        bio: formData.bio,
        experience: formData.experience,
        location: formData.location,
        rate_per_hour: parseFloat(formData.rate_per_hour),
        is_online: true
      });

      // Step 2: Add all services in 1 ultra-fast batch request
      const batchPayload = selectedServices.map(s => ({
        service_id: s.service_id,
        custom_rate: parseFloat(s.custom_rate || formData.rate_per_hour)
      }));
      try {
        await api.post('/thekedar-services/batch', batchPayload);
      } catch {
        // Fallback to parallel requests if needed
        await Promise.all(batchPayload.map(item => api.post('/thekedar-services', item)));
      }

      sessionStorage.setItem('thekedar_profile_checked', 'true');
      showToast('Profile completed! Welcome to KarigarNow.', 'success');
      navigate('/thekedar/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-16 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto animate-in slide-up">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ap border border-accent2/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent2"></span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-accent">Registration Step 2</span>
          </div>
          <h1 className="font-display text-[48px] font-black text-ink tracking-tight leading-none mb-4">Complete Your Profile</h1>
          <p className="text-mid font-medium max-w-lg mx-auto leading-relaxed">
            Finalize your profile identity on KarigarNow to start receiving service requests in your area.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* About Section */}
          <div className="bg-white border border-rule rounded-3xl p-8 lg:p-10 shadow-premium">
            <h2 className="text-[22px] font-display font-bold text-ink mb-8 flex items-center gap-3">
               <span className="w-1.5 h-6 bg-accent2 rounded-full"></span>
               Business Identity
            </h2>
            
            <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">Business Bio</label>                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell customers about your team's expertise, years of experience and the quality of work you deliver..."
                  className="w-full px-4 py-3.5 rounded-xl bg-bg border border-rule text-ink text-[15px] font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all shadow-inner-soft min-h-[140px] resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">Years of Experience</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 12 years"
                    className="w-full px-4 py-3.5 rounded-xl bg-bg border border-rule text-ink text-[15px] font-bold outline-none focus:border-accent transition-all shadow-inner-soft"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">City / Service Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Indore, MP"
                    className="w-full px-4 py-3.5 rounded-xl bg-bg border border-rule text-ink text-[15px] font-bold outline-none focus:border-accent transition-all shadow-inner-soft"
                    required
                  />
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">Base Hourly Rate (₹)</label>
                <input
                  type="number"
                  name="rate_per_hour"
                  value={formData.rate_per_hour}
                  onChange={handleInputChange}
                  placeholder="e.g. 200"
                  className="w-full px-4 py-3.5 rounded-xl bg-bg border border-rule text-ink text-[15px] font-black outline-none focus:border-accent transition-all shadow-inner-soft"
                  required
                />
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Standard rate per worker per hour</p>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white border border-rule rounded-3xl p-8 lg:p-10 shadow-premium">
            <h2 className="text-[22px] font-display font-bold text-ink mb-2 flex items-center justify-between">
               <span className="flex items-center gap-3">
                 <span className="w-1.5 h-6 bg-accent2 rounded-full"></span>
                 Core Services
               </span>
               {loadingServices && (
                 <span className="text-[12px] font-medium text-muted flex items-center gap-2">
                   <svg className="animate-spin h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Updating live categories...
                 </span>
               )}
            </h2>
            <p className="text-[14px] text-mid font-medium mb-10 ml-4.5">Select the specialized services your team handles.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(service => {
                const isSelected = selectedServices.find(s => s.service_id === service.id);
                return (
                  <div key={service.id} className="group space-y-3">
                    <div
                      onClick={() => toggleService(service)}
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full ${
                        isSelected 
                        ? 'border-accent2 bg-ap shadow-inner-soft' 
                        : 'border-rule bg-white hover:border-muted hover:bg-bg shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[16px] font-black tracking-tight ${isSelected ? 'text-accent' : 'text-ink'}`}>
                          {service.name}
                        </span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-accent2 border-accent2' : 'border-rule'
                        }`}>
                          {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                      </div>
                      <p className="text-[12px] text-mid font-medium leading-relaxed line-clamp-2">{service.description}</p>
                    </div>

                    {isSelected && (
                      <div className="px-2 animate-in scale-in">
                        <label className="text-[9px] font-black text-accent uppercase tracking-[0.15em] mb-1 block">
                          Rate for {service.name} (₹/hr)
                        </label>
                        <input
                          type="number"
                          value={isSelected.custom_rate}
                          onChange={(e) => handleServiceRateChange(service.id, e.target.value)}
                          placeholder={formData.rate_per_hour || "200"}
                          className="w-full px-4 py-2.5 text-[14px] font-bold text-ink rounded-xl border-2 border-accent2 bg-white focus:outline-none shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-5 bg-accent text-white font-display text-[18px] font-black tracking-tight rounded-2xl shadow-premium hover:shadow-premium-hover hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Finalizing Identity...
                </>
              ) : (
                <>
                  Finalize and Launch Dashboard
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
