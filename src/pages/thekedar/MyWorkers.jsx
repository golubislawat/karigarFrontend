import { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import ToastContext from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

function WorkerCard({ worker, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(worker.id, !worker.is_available);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-white border border-rule rounded-2xl p-6 shadow-premium group hover:border-accent2/30 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ap border border-accent2/10 flex items-center justify-center text-[18px] font-black text-accent2 shadow-inner-soft">
              {worker.name.charAt(0)}
            </div>
            <div>
              <p className="text-[16px] font-bold text-ink leading-none mb-1">{worker.name}</p>
              <p className="text-[12px] font-bold text-muted uppercase tracking-widest">{worker.mobile || 'No contact'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleToggle} 
            disabled={toggling} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-bg transition-all"
          >
            <div className={`w-8 h-4 rounded-full relative transition-all duration-300 ${worker.is_available ? 'bg-accent2' : 'bg-rule'}`}>
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${worker.is_available ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${worker.is_available ? 'text-accent2' : 'text-muted'}`}>
              {worker.is_available ? 'Available' : 'Busy'}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(Array.isArray(worker.skills)
            ? worker.skills
            : (worker.skills ? String(worker.skills).replace(/[{}]/g, '').split(',') : [])
          ).filter(Boolean).map((skill, i) => (
            <span key={i} className="text-[10px] font-black px-2.5 py-1 rounded-full bg-bg border border-rule/50 text-mid uppercase tracking-widest group-hover:border-accent2/20 transition-all">
              {String(skill).trim()}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-rule/50">
        <div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-0.5">Daily Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-black text-ink">{formatCurrency(worker.daily_rate)}</span>
            <span className="text-[11px] font-bold text-muted">/day</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(worker)}
            className="p-2.5 rounded-xl border border-rule bg-white text-mid hover:text-ink hover:border-ink transition-all shadow-sm"
            title="Edit Worker"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button
            onClick={() => onDelete(worker)}
            className="p-2.5 rounded-xl border border-rule bg-white text-muted hover:text-red hover:border-red/30 transition-all shadow-sm"
            title="Delete Worker"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkerModal({ worker, services, onClose, onSubmit }) {
  const [name, setName] = useState(worker?.name || '');
  const [mobile, setMobile] = useState(worker?.mobile || '');
  const [dailyRate, setDailyRate] = useState(worker?.daily_rate || '');
  const [selectedSkills, setSelectedSkills] = useState(Array.isArray(worker?.skills) ? worker.skills : []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useContext(ToastContext);

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!dailyRate || dailyRate <= 0) { setError('Valid daily rate is required'); return; }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), mobile, daily_rate: Number(dailyRate), skills: selectedSkills }, worker?.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save worker');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-sm bg-ink/60 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-premium border border-rule animate-in slide-up">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[24px] font-display font-black text-ink tracking-tight">
            {worker ? 'Update Worker' : 'Add Worker'}
          </h3>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Raju Mistri"
              className="w-full px-4 py-3.5 rounded-xl bg-bg border border-rule text-ink text-[15px] font-medium outline-none focus:border-accent transition-all shadow-inner-soft"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="10-digit mobile"
              maxLength={10}
              className="w-full px-4 py-3.5 rounded-xl bg-bg border border-rule text-ink text-[15px] font-medium outline-none focus:border-accent transition-all shadow-inner-soft"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">Daily Rate (₹) *</label>
            <input
              type="number"
              value={dailyRate}
              onChange={e => setDailyRate(e.target.value)}
              placeholder="e.g. 450"
              min="1"
              className="w-full px-4 py-3.5 rounded-xl bg-bg border border-rule text-ink text-[15px] font-bold outline-none focus:border-accent transition-all shadow-inner-soft"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted uppercase tracking-widest px-0.5">Skills & Expertise</label>
            <div className="flex flex-wrap gap-2 p-4 bg-bg rounded-xl border border-rule shadow-inner-soft">
              {(services || []).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSkillToggle(s.name)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all ${
                    selectedSkills.includes(s.name)
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-white border-rule text-muted hover:border-muted'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rbg border border-red/20 text-red text-[12px] font-bold text-center animate-in fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-accent text-white text-[15px] font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving Worker...' : worker ? 'Update Information' : 'Add to Team'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MyWorkers() {
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [deleteWorker, setDeleteWorker] = useState(null);
  const { showToast } = useContext(ToastContext);

  const loadWorkers = async () => {
    try {
      const res = await api.get('/workers');
      if (res.data.success) {
        setWorkers(res.data.data || []);
      }
    } catch {
      showToast('Failed to load workers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = () => {
    api.get('/services')
      .then(res => { if (res.data.success) setServices(res.data.data); })
      .catch(() => {});
  };

  useEffect(() => { loadWorkers(); loadServices(); }, []);

  const handleToggle = async (id, is_available) => {
    try {
      const res = await api.put(`/workers/${id}`, { is_available });
      if (res.data.success) {
        setWorkers(prev => prev.map(w => w.id === id ? { ...w, is_available } : w));
        showToast(`Worker marked as ${is_available ? 'available' : 'busy'}`, 'success');
      }
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleAddWorker = async (data) => {
    const res = await api.post('/workers', data);
    if (res.data.success) {
      showToast('Worker added to your team!', 'success');
      if (res.data.data) {
        setWorkers(prev => [res.data.data, ...prev]);
      }
      await loadWorkers();
      return res.data;
    } else {
      throw new Error(res.data.message || 'Failed to add worker');
    }
  };

  const handleEditWorker = async (data, id) => {
    const res = await api.put(`/workers/${id}`, data);
    if (res.data.success) {
      showToast('Worker updated!', 'success');
      if (res.data.data) {
        setWorkers(prev => prev.map(w => w.id === id ? res.data.data : w));
      }
      await loadWorkers();
      return res.data;
    } else {
      throw new Error(res.data.message || 'Failed to update worker');
    }
  };

  const handleDeleteWorker = async (worker) => {
    setDeleteWorker(worker);
  };

  const confirmDelete = async () => {
    try {
      const res = await api.delete(`/workers/${deleteWorker.id}`);
      if (res.data.success) {
        showToast('Worker removed', 'success');
        setWorkers(prev => prev.filter(w => w.id !== deleteWorker.id));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Cannot remove worker with active booking';
      showToast(msg, 'error');
    } finally {
      setDeleteWorker(null);
    }
  };

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Available' && w.is_available) || (filter === 'Busy' && !w.is_available);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="pb-20 md:pb-12 animate-in slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ap border border-accent2/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-accent2"></span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-accent">Team Management</span>
          </div>
          <h1 className="font-display text-[48px] font-black text-ink tracking-tight leading-none mb-2">My Team</h1>
          <p className="text-mid font-medium">
            You have <span className="text-ink font-bold">{workers.length} registered workers</span> in your team.
          </p>
        </div>
        
        {/* Responsive Add Button */}
        <button
          onClick={() => { setEditWorker(null); setModalOpen(true); }}
          className="w-full md:w-auto px-8 py-4 bg-accent text-white text-[15px] font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Add New Worker
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8 p-6 bg-white border border-rule rounded-2xl shadow-premium">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by worker name..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-bg border border-rule text-ink text-[14px] outline-none focus:border-accent transition-all shadow-inner-soft"
          />
        </div>
        <div className="flex gap-2 p-1 bg-bg border border-rule rounded-xl">
          {['All', 'Available', 'Busy'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-mid'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-bg3 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="rounded-2xl py-24 text-center bg-white border border-dashed border-rule shadow-inner-soft">
          <div className="w-20 h-20 bg-bg rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
          <p className="text-mid font-bold uppercase tracking-widest text-[13px] mb-4">
            {workers.length === 0 ? 'No workers in your team yet' : 'No workers match your criteria'}
          </p>
          {workers.length === 0 && (
            <button
              onClick={() => { setEditWorker(null); setModalOpen(true); }}
              className="px-6 py-3 bg-accent text-white text-[13px] font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Add First Worker
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map(worker => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onToggle={handleToggle}
              onEdit={(w) => { setEditWorker(w); setModalOpen(true); }}
              onDelete={handleDeleteWorker}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <WorkerModal
          worker={editWorker}
          services={services}
          onClose={() => setModalOpen(false)}
          onSubmit={editWorker ? handleEditWorker : handleAddWorker}
        />
      )}

      {deleteWorker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-sm bg-ink/60 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-premium border border-red/20 animate-in scale-in">
            <div className="w-16 h-16 bg-rbg rounded-full flex items-center justify-center mb-6 text-red">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </div>
            <h3 className="text-[20px] font-display font-black text-ink tracking-tight mb-2">Remove Worker?</h3>
            <p className="text-mid text-[14px] mb-8 leading-relaxed">
              Are you sure you want to remove <span className="text-ink font-bold">{deleteWorker.name}</span>? This action cannot be undone if they have no active jobs.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteWorker(null)} className="py-3 bg-bg border border-rule text-ink text-[13px] font-bold rounded-xl hover:bg-bg2 transition-all">
                Keep Worker
              </button>
              <button onClick={confirmDelete} className="py-3 bg-red text-white text-[13px] font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all">
                Remove Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
