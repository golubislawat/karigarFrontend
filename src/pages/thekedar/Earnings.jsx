import { useState, useEffect, useMemo, useContext } from 'react';
import api from '../../api/axios';
import ToastContext from '../../context/ToastContext';
import { formatCurrency, formatDateShort, getDayName, isThisMonth, isThisWeek } from '../../utils/formatters';

export default function Earnings() {
  const { showToast } = useContext(ToastContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    api.get('/bookings?status=completed&page=0&size=100')
      .then(res => {
        if (res.data.success) setBookings(res.data.data.content || []);
      })
      .catch(() => showToast('Failed to load earnings', 'error'))
      .finally(() => setLoading(false));
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

  const getFee = (b) => {
    if (b.platform_fee != null && !isNaN(Number(b.platform_fee))) {
      return Number(b.platform_fee);
    }
    if (b.total_amount != null && !isNaN(Number(b.total_amount))) {
      return Number(b.total_amount) * 0.05;
    }
    return 0;
  };

  const completedBookings = bookings.filter(b => b.booking_status === 'completed');

  const totalEarned = completedBookings.reduce((sum, b) => sum + getPayout(b), 0);
  const thisMonth = completedBookings.filter(b => isThisMonth(b.scheduled_at || b.created_at));
  const thisMonthEarnings = thisMonth.reduce((sum, b) => sum + getPayout(b), 0);
  const thisWeek = completedBookings.filter(b => isThisWeek(b.scheduled_at || b.created_at));
  const thisWeekEarnings = thisWeek.reduce((sum, b) => sum + getPayout(b), 0);
  const totalJobs = completedBookings.length;

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayStr = d.toDateString();
      const dayEarnings = completedBookings
        .filter(b => {
          const dateStr = b.scheduled_at || b.created_at;
          if (!dateStr) return false;
          const bDate = new Date(dateStr);
          bDate.setHours(0, 0, 0, 0);
          return bDate.toDateString() === dayStr;
        })
        .reduce((sum, b) => sum + getPayout(b), 0);
      days.push({
        date: d,
        label: getDayName(d),
        shortLabel: getDayName(d).substring(0, 3),
        earnings: dayEarnings,
        hasEarnings: dayEarnings > 0,
      });
    }
    return days;
  }, [completedBookings]);

  const maxDayEarnings = Math.max(...last7Days.map(d => d.earnings), 1);

  const paginatedBookings = completedBookings
    .sort((a, b) => new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at))
    .slice(page * pageSize, (page + 1) * pageSize);

  const totalPages = Math.ceil(completedBookings.length / pageSize);

  return (
    <div className="pb-20 md:pb-12 animate-in slide-up">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ap border border-accent2/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-accent2"></span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-accent">Financial Overview</span>
        </div>
        <h1 className="font-display text-[48px] font-black text-ink tracking-tight leading-none">Earnings</h1>
        <p className="text-mid font-medium mt-2">Track your revenue and performance metrics.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Earned', value: formatCurrency(totalEarned), accent: true },
          { label: 'This Month', value: formatCurrency(thisMonthEarnings), accent: false },
          { label: 'This Week', value: formatCurrency(thisWeekEarnings), accent: false },
          { label: 'Total Jobs', value: totalJobs, accent: false },
        ].map(card => (
          <div key={card.label} className="bg-white border border-rule rounded-2xl p-6 shadow-premium group hover:border-accent2/30 transition-all">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 group-hover:text-accent2 transition-colors">
              {card.label}
            </p>
            <p className={`text-[28px] font-display font-black tracking-tight ${card.accent ? 'text-accent2' : 'text-ink'}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bar Chart — Last 7 Days */}
      <div className="bg-white border border-rule rounded-2xl p-8 mb-10 shadow-premium">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-[20px] font-display font-bold text-ink flex items-center gap-3">
             <span className="w-1.5 h-6 bg-accent2 rounded-full"></span>
             Revenue: Last 7 Days
           </h2>
        </div>
        <div className="flex items-end gap-3 h-[200px] pt-8">
          {last7Days.map((day, i) => {
            const heightPct = maxDayEarnings > 0 ? (day.earnings / maxDayEarnings) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full">
                <div className="relative w-full flex flex-col items-center flex-1 justify-end">
                  {day.hasEarnings && (
                    <div
                      className="w-full rounded-t-xl transition-all group-hover:bg-accent2 bg-accent absolute bottom-0 shadow-premium"
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                    />
                  )}
                  {!day.hasEarnings && (
                    <div
                      className="w-full absolute bottom-0 border-b-2 border-dashed border-rule"
                      style={{ height: '2px' }}
                    />
                  )}
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all absolute -top-10 bg-ink text-white px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-premium translate-y-2 group-hover:translate-y-0">
                    <span className="text-[11px] font-black text-accent2">
                      {formatCurrency(day.earnings)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-ink transition-colors">
                  {day.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white border border-rule rounded-2xl shadow-premium overflow-hidden">
        <div className="p-6 border-b border-rule bg-bg2/30">
           <h2 className="text-[16px] font-bold text-ink uppercase tracking-widest">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-rule">
                {['Date', 'Service', 'Customer', 'Workers', 'Total Amount', 'Platform Fee', 'Your Payout'].map(h => (
                  <th key={h} className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/50">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                       <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                       <p className="text-[13px] font-bold uppercase tracking-widest">No completed bookings found</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-bg transition-colors group">
                  <td className="px-6 py-5 text-[14px] font-medium text-ink">
                    {formatDateShort(booking.scheduled_at || booking.created_at)}
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 rounded bg-ap border border-accent2/10 text-[11px] font-bold text-accent uppercase tracking-wider">
                       {booking.service?.name || booking.service_name || 'Service'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[14px] text-mid font-medium">
                    {booking.consumer_name ? booking.consumer_name.split(' ')[0] + ' ' + (booking.consumer_name.split(' ')[1]?.[0] || '') + '.' : 'Customer'}
                  </td>
                  <td className="px-6 py-5 text-[14px] text-mid font-bold">
                    {booking.workers_needed || 1}
                  </td>
                  <td className="px-6 py-5 text-[14px] font-bold text-ink">
                    {formatCurrency(booking.total_amount)}
                  </td>
                  <td className="px-6 py-5 text-[13px] text-muted font-medium">
                    {formatCurrency(getFee(booking))}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[16px] font-black text-accent2 font-display">
                      {formatCurrency(getPayout(booking))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-4 bg-bg border-t border-rule">
            <p className="text-[12px] font-bold text-muted uppercase tracking-widest">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-white border border-rule text-ink text-[12px] font-bold rounded-lg hover:bg-bg2 transition-all disabled:opacity-30 shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 bg-white border border-rule text-ink text-[12px] font-bold rounded-lg hover:bg-bg2 transition-all disabled:opacity-30 shadow-sm"
              >
                Next Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
