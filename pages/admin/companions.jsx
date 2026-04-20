// pages/admin/companions.jsx
import { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatCurrency, formatDate, avatarPlaceholder } from '../../lib/utils';
import toast from 'react-hot-toast';
import {
  RiSearchLine, RiEyeLine, RiCloseLine, RiUserForbidLine,
  RiCheckLine, RiStarFillLine, RiShieldCheckLine,
  RiStarLine, RiFilter3Line, RiAddLine,
} from 'react-icons/ri';
import { MdVerified } from 'react-icons/md';

const MOCK_COMPANIONS = [
  { uid: 'c1', displayName: 'Priya Sharma',   gender: 'female', age: 24, city: 'Mumbai',    hourlyRate: 800,  rating: 4.8, reviewCount: 47, isVerified: true,  isFeatured: true,  plan: 'premium', bookingsCount: 34, isActive: true,  isBlocked: false },
  { uid: 'c2', displayName: 'Ananya Roy',     gender: 'female', age: 26, city: 'Delhi',     hourlyRate: 700,  rating: 4.7, reviewCount: 31, isVerified: true,  isFeatured: true,  plan: 'premium', bookingsCount: 28, isActive: true,  isBlocked: false },
  { uid: 'c3', displayName: 'Riya Patel',     gender: 'female', age: 22, city: 'Bangalore', hourlyRate: 750,  rating: 4.6, reviewCount: 19, isVerified: true,  isFeatured: false, plan: 'free',    bookingsCount: 15, isActive: true,  isBlocked: false },
  { uid: 'c4', displayName: 'Arjun Mehta',   gender: 'male',   age: 28, city: 'Bangalore', hourlyRate: 600,  rating: 4.5, reviewCount: 12, isVerified: true,  isFeatured: false, plan: 'free',    bookingsCount: 9,  isActive: true,  isBlocked: false },
  { uid: 'c5', displayName: 'Dev Malhotra',  gender: 'male',   age: 25, city: 'Hyderabad', hourlyRate: 500,  rating: 4.2, reviewCount: 7,  isVerified: false, isFeatured: false, plan: 'free',    bookingsCount: 3,  isActive: false, isBlocked: false },
  { uid: 'c6', displayName: 'Simran Kaur',   gender: 'female', age: 23, city: 'Pune',      hourlyRate: 650,  rating: 0,   reviewCount: 0,  isVerified: false, isFeatured: false, plan: 'free',    bookingsCount: 0,  isActive: false, isBlocked: false },
  { uid: 'c7', displayName: 'Rohan Sharma',  gender: 'male',   age: 30, city: 'Chennai',   hourlyRate: 550,  rating: 3.8, reviewCount: 4,  isVerified: true,  isFeatured: false, plan: 'free',    bookingsCount: 4,  isActive: true,  isBlocked: true  },
];

export default function AdminCompanionsPage() {
  const [companions,  setCompanions]  = useState(MOCK_COMPANIONS);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [selected,    setSelected]    = useState(null);

  const filtered = companions.filter(c => {
    if (search && !c.displayName.toLowerCase().includes(search.toLowerCase()) &&
        !c.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'verified'   && !c.isVerified) return false;
    if (filter === 'unverified' && c.isVerified)  return false;
    if (filter === 'blocked'    && !c.isBlocked)  return false;
    if (filter === 'featured'   && !c.isFeatured) return false;
    return true;
  });

  const counts = {
    all:        companions.length,
    verified:   companions.filter(c => c.isVerified).length,
    unverified: companions.filter(c => !c.isVerified).length,
    featured:   companions.filter(c => c.isFeatured).length,
    blocked:    companions.filter(c => c.isBlocked).length,
  };

  const toggleBlock = (uid, current) => {
    setCompanions(p => p.map(c => c.uid === uid ? { ...c, isBlocked: !current, isActive: current ? c.isActive : false } : c));
    toast.success(current ? 'Companion unblocked' : 'Companion blocked');
    setSelected(s => s ? { ...s, isBlocked: !current } : null);
  };

  const toggleFeatured = (uid, current) => {
    setCompanions(p => p.map(c => c.uid === uid ? { ...c, isFeatured: !current } : c));
    toast.success(!current ? 'Added to featured' : 'Removed from featured');
    setSelected(s => s ? { ...s, isFeatured: !current } : null);
  };

  return (
    <AdminLayout title="Companions Management">
      <Head><title>Companions – Admin</title></Head>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(counts).map(([k, v], i) => (
          <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card p-3 cursor-pointer transition-all ${filter === k ? 'border-indigo-500/30' : ''}`}
            onClick={() => setFilter(k)}
          >
            <div className="text-xs text-gray-500 capitalize mb-1">{k}</div>
            <div className="text-xl font-bold text-white">{v}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="glass-input pl-9 text-sm" placeholder="Search name or city…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="text-xs text-gray-500">{filtered.length} companions</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Companion</th>
                <th>City</th>
                <th>Rate</th>
                <th>Rating</th>
                <th>Bookings</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Flags</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.uid}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img src={avatarPlaceholder(c.gender, c.uid)} alt="" className="w-8 h-8 rounded-full object-cover" />
                        {c.isVerified && <MdVerified className="absolute -bottom-0.5 -right-0.5 text-emerald-400 text-xs" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{c.displayName}</div>
                        <div className="text-xs text-gray-500">{c.age}y · {c.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-400">{c.city}</td>
                  <td className="text-sm text-white">{formatCurrency(c.hourlyRate)}/hr</td>
                  <td>
                    {c.reviewCount > 0 ? (
                      <span className="flex items-center gap-1 text-sm text-amber-400">
                        <RiStarFillLine className="text-xs" /> {c.rating} <span className="text-gray-600 text-xs">({c.reviewCount})</span>
                      </span>
                    ) : <span className="text-xs text-gray-600">New</span>}
                  </td>
                  <td className="text-sm text-white font-semibold">{c.bookingsCount}</td>
                  <td>
                    <span className={c.plan === 'premium' ? 'badge-premium' : 'text-xs text-gray-500 capitalize'}>{c.plan}</span>
                  </td>
                  <td>
                    {c.isBlocked ? <span className="status-rejected">Blocked</span>
                     : c.isActive ? <span className="status-approved">Active</span>
                     : <span className="status-pending">Inactive</span>}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      {c.isVerified && <span className="text-emerald-400 text-xs" title="Verified">✓KYC</span>}
                      {c.isFeatured && <span className="text-indigo-400 text-xs" title="Featured">⭐</span>}
                    </div>
                  </td>
                  <td>
                    <button onClick={() => setSelected(c)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                      <RiEyeLine /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-600">No companions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <img src={avatarPlaceholder(selected.gender, selected.uid)} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                  <div>
                    <div className="font-semibold text-white text-lg flex items-center gap-1">
                      {selected.displayName}
                      {selected.isVerified && <MdVerified className="text-emerald-400 text-base" />}
                    </div>
                    <div className="text-xs text-gray-500">{selected.age}y · {selected.city} · {selected.gender}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><RiCloseLine size={20} /></button>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  ['Hourly Rate',   formatCurrency(selected.hourlyRate) + '/hr'],
                  ['Rating',        selected.reviewCount > 0 ? `${selected.rating} ⭐ (${selected.reviewCount} reviews)` : 'No reviews yet'],
                  ['Total Bookings',selected.bookingsCount],
                  ['Plan',          selected.plan],
                  ['KYC Status',    selected.isVerified ? '✅ Verified' : '⏳ Pending'],
                  ['Featured',      selected.isFeatured ? '⭐ Yes' : 'No'],
                  ['Account',       selected.isBlocked ? '🚫 Blocked' : selected.isActive ? '✅ Active' : '⏸ Inactive'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleFeatured(selected.uid, selected.isFeatured)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                    selected.isFeatured
                      ? 'bg-gray-500/10 border border-gray-500/20 text-gray-400 hover:bg-gray-500/20'
                      : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                  }`}
                >
                  {selected.isFeatured ? <><RiCloseLine /> Remove Featured</> : <><RiStarLine /> Set Featured</>}
                </button>
                <button
                  onClick={() => toggleBlock(selected.uid, selected.isBlocked)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                    selected.isBlocked
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  {selected.isBlocked ? <><RiCheckLine /> Unblock</> : <><RiUserForbidLine /> Block</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
