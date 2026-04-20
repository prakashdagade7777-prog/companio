// pages/admin/bookings.jsx
import { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatCurrency, formatDate, formatDateTime, STATUS_META } from '../../lib/utils';
import toast from 'react-hot-toast';
import {
  RiSearchLine, RiEyeLine, RiCloseLine, RiCalendarLine,
  RiTimeLine, RiMapPin2Line, RiUserLine, RiUserStarLine,
  RiMoneyDollarCircleLine, RiFilterLine,
} from 'react-icons/ri';

const MOCK_BOOKINGS = [
  {
    bookingId: 'BK001', userId: 'u8',  companionId: 'c1',
    userSnapshot:      { name: 'Rahul Mehta',  avatar: '' },
    companionSnapshot: { displayName: 'Priya Sharma', city: 'Mumbai' },
    date: '2025-01-20', startTime: '18:00', hours: 3,
    location: 'Taj Hotel, Mumbai', occasion: 'Corporate Dinner',
    baseRate: 800, surgeMultiplier: 1.2, totalAmount: 2880,
    status: 'confirmed',
    createdAt: { toDate: () => new Date('2025-01-18T14:30:00') },
  },
  {
    bookingId: 'BK002', userId: 'u10', companionId: 'c2',
    userSnapshot:      { name: 'Arjun Das',    avatar: '' },
    companionSnapshot: { displayName: 'Ananya Roy',   city: 'Delhi' },
    date: '2025-01-22', startTime: '14:00', hours: 2,
    location: 'Connaught Place, Delhi', occasion: 'Shopping',
    baseRate: 700, surgeMultiplier: 1.0, totalAmount: 1400,
    status: 'pending_verification',
    createdAt: { toDate: () => new Date('2025-01-18T13:15:00') },
  },
  {
    bookingId: 'BK003', userId: 'u12', companionId: 'c3',
    userSnapshot:      { name: 'Priya Singh',  avatar: '' },
    companionSnapshot: { displayName: 'Riya Patel',   city: 'Bangalore' },
    date: '2025-01-25', startTime: '20:00', hours: 4,
    location: 'Indiranagar, Bangalore', occasion: 'Birthday Party',
    baseRate: 750, surgeMultiplier: 1.5, totalAmount: 4500,
    status: 'pending_payment',
    createdAt: { toDate: () => new Date('2025-01-18T12:00:00') },
  },
  {
    bookingId: 'BK004', userId: 'u5',  companionId: 'c4',
    userSnapshot:      { name: 'Vikram Nair',  avatar: '' },
    companionSnapshot: { displayName: 'Meera Iyer',   city: 'Mumbai' },
    date: '2025-01-15', startTime: '12:00', hours: 5,
    location: 'Juhu Beach, Mumbai', occasion: 'Travel Companion',
    baseRate: 900, surgeMultiplier: 1.0, totalAmount: 4500,
    status: 'completed',
    createdAt: { toDate: () => new Date('2025-01-14T10:00:00') },
  },
  {
    bookingId: 'BK005', userId: 'u15', companionId: 'c5',
    userSnapshot:      { name: 'Kiran Joshi',  avatar: '' },
    companionSnapshot: { displayName: 'Simran Kaur',  city: 'Delhi' },
    date: '2025-01-17', startTime: '19:00', hours: 3,
    location: 'Lajpat Nagar, Delhi', occasion: 'Wedding',
    baseRate: 800, surgeMultiplier: 1.25, totalAmount: 3000,
    status: 'cancelled',
    createdAt: { toDate: () => new Date('2025-01-16T09:00:00') },
  },
  {
    bookingId: 'BK006', userId: 'u7',  companionId: 'c1',
    userSnapshot:      { name: 'Sanjay Reddy', avatar: '' },
    companionSnapshot: { displayName: 'Priya Sharma', city: 'Mumbai' },
    date: '2025-01-28', startTime: '21:00', hours: 2,
    location: 'BKC, Mumbai', occasion: 'Corporate Dinner',
    baseRate: 800, surgeMultiplier: 1.5, totalAmount: 2400,
    status: 'confirmed',
    createdAt: { toDate: () => new Date('2025-01-18T08:00:00') },
  },
];

const ALL_STATUSES = ['all', 'pending_payment', 'pending_verification', 'confirmed', 'completed', 'cancelled', 'disputed'];

const STATUS_STYLE = {
  pending_payment:      'status-pending',
  pending_verification: 'status-pending',
  confirmed:            'status-approved',
  completed:            'status-approved',
  cancelled:            'status-rejected',
  disputed:             'status-rejected',
};

const SURGE_COLOR = (m) => m >= 1.5 ? 'text-rose-400' : m >= 1.25 ? 'text-amber-400' : m > 1 ? 'text-amber-300' : 'text-emerald-400';

export default function AdminBookingsPage() {
  const [bookings,  setBookings]  = useState(MOCK_BOOKINGS);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);

  const filtered = bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    const q = search.toLowerCase();
    if (q && !b.userSnapshot.name.toLowerCase().includes(q) &&
        !b.companionSnapshot.displayName.toLowerCase().includes(q) &&
        !b.bookingId.toLowerCase().includes(q)) return false;
    return true;
  });

  const counts = Object.fromEntries(ALL_STATUSES.map(s => [s, s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length]));

  const totalRevenue  = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.totalAmount, 0);
  const totalBooked   = bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).length;
  const pendingCount  = bookings.filter(b => ['pending_payment', 'pending_verification'].includes(b.status)).length;

  const handleCancel = (id) => {
    setBookings(p => p.map(b => b.bookingId === id ? { ...b, status: 'cancelled' } : b));
    toast.success('Booking cancelled');
    setSelected(null);
  };

  const handleMarkComplete = (id) => {
    setBookings(p => p.map(b => b.bookingId === id ? { ...b, status: 'completed' } : b));
    toast.success('Booking marked as completed');
    setSelected(null);
  };

  return (
    <AdminLayout title="Bookings Management">
      <Head><title>Bookings – Admin</title></Head>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings',   value: bookings.length,           color: 'indigo'  },
          { label: 'Active/Confirmed', value: totalBooked,               color: 'emerald' },
          { label: 'Pending Action',   value: pendingCount,              color: 'amber'   },
          { label: 'Revenue (Done)',   value: formatCurrency(totalRevenue), color: 'violet'  },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${
              s.color === 'indigo' ? 'text-indigo-300' : s.color === 'emerald' ? 'text-emerald-300' :
              s.color === 'amber' ? 'text-amber-300' : 'text-violet-300'
            }`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-1 p-1 glass rounded-xl">
          {ALL_STATUSES.slice(0, 5).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === s ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s.replace('_', ' ')} ({counts[s]})
            </button>
          ))}
        </div>
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="glass-input pl-9 w-56 text-sm" placeholder="Search ID, user, companion…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Companion</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Surge</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.bookingId}>
                  <td className="font-mono text-xs text-indigo-400">{b.bookingId}</td>
                  <td>
                    <div className="text-sm text-white font-medium">{b.userSnapshot.name}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-300">{b.companionSnapshot.displayName}</div>
                    <div className="text-xs text-gray-600">{b.companionSnapshot.city}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-300">{formatDate(b.date)}</div>
                    <div className="text-xs text-gray-600">{b.startTime}</div>
                  </td>
                  <td className="text-sm text-gray-400">{b.hours}hr</td>
                  <td className={`text-xs font-semibold ${SURGE_COLOR(b.surgeMultiplier)}`}>
                    {b.surgeMultiplier > 1 ? `${b.surgeMultiplier}×` : 'Normal'}
                  </td>
                  <td className="font-semibold text-white">{formatCurrency(b.totalAmount)}</td>
                  <td><span className={STATUS_STYLE[b.status] || 'status-pending'}>{b.status.replace('_', ' ')}</span></td>
                  <td>
                    <button onClick={() => setSelected(b)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap">
                      <RiEyeLine /> Details
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-600">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-white">Booking Details</h2>
                  <p className="text-xs font-mono text-indigo-400">{selected.bookingId}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><RiCloseLine size={20} /></button>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="glass p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <RiUserLine className="text-indigo-400 text-sm" />
                    <span className="text-xs text-gray-500">User</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{selected.userSnapshot.name}</div>
                </div>
                <div className="glass p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <RiUserStarLine className="text-emerald-400 text-sm" />
                    <span className="text-xs text-gray-500">Companion</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{selected.companionSnapshot.displayName}</div>
                  <div className="text-xs text-gray-500">{selected.companionSnapshot.city}</div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-5">
                {[
                  { icon: <RiCalendarLine />, label: 'Date', value: formatDate(selected.date) },
                  { icon: <RiTimeLine />,     label: 'Time', value: `${selected.startTime} · ${selected.hours} hour${selected.hours > 1 ? 's' : ''}` },
                  { icon: <RiMapPin2Line />,  label: 'Location', value: selected.location },
                  { icon: null,              label: 'Occasion', value: selected.occasion },
                  { icon: null,              label: 'Base Rate', value: `${formatCurrency(selected.baseRate)}/hr` },
                  { icon: null,              label: 'Surge',     value: `${selected.surgeMultiplier}×` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start justify-between py-1.5 border-b border-white/5 text-sm gap-3">
                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                      {icon && <span className="text-indigo-400">{icon}</span>} {label}
                    </span>
                    <span className="text-white font-medium text-right">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 text-base font-bold">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <RiMoneyDollarCircleLine className="text-emerald-400" /> Total Amount
                  </span>
                  <span className="text-gradient">{formatCurrency(selected.totalAmount)}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-gray-400">Status</span>
                <span className={STATUS_STYLE[selected.status] || 'status-pending'}>{selected.status.replace('_', ' ')}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {['confirmed', 'pending_verification'].includes(selected.status) && (
                  <button
                    onClick={() => handleMarkComplete(selected.bookingId)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all"
                  >
                    Mark Completed
                  </button>
                )}
                {!['cancelled', 'completed'].includes(selected.status) && (
                  <button
                    onClick={() => handleCancel(selected.bookingId)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition-all"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
