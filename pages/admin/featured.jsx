// pages/admin/featured.jsx
import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatCurrency, formatDate, avatarPlaceholder } from '../../lib/utils';
import toast from 'react-hot-toast';
import { RiStarLine, RiStarFillLine, RiCloseLine, RiAddLine } from 'react-icons/ri';

const MOCK_COMPANIONS = [
  { uid: 'c1', displayName: 'Priya Sharma',  city: 'Mumbai',    plan: 'premium', isFeatured: true,  featuredUntil: '2025-02-01', gender: 'female', hourlyRate: 800, rating: 4.8 },
  { uid: 'c2', displayName: 'Ananya Roy',    city: 'Delhi',     plan: 'premium', isFeatured: true,  featuredUntil: '2025-01-28', gender: 'female', hourlyRate: 700, rating: 4.7 },
  { uid: 'c3', displayName: 'Arjun Mehta',   city: 'Bangalore', plan: 'free',    isFeatured: false, featuredUntil: null,         gender: 'male',   hourlyRate: 600, rating: 4.5 },
  { uid: 'c4', displayName: 'Riya Patel',    city: 'Chennai',   plan: 'premium', isFeatured: false, featuredUntil: null,         gender: 'female', hourlyRate: 750, rating: 4.6 },
  { uid: 'c5', displayName: 'Dev Malhotra',  city: 'Hyderabad', plan: 'free',    isFeatured: false, featuredUntil: null,         gender: 'male',   hourlyRate: 500, rating: 4.2 },
];

const BOOST_DAYS = [7, 30, 90];

export default function AdminFeaturedPage() {
  const [companions, setCompanions] = useState(MOCK_COMPANIONS);
  const [modal, setModal] = useState(null); // uid to feature
  const [days, setDays] = useState(30);

  const toggleFeatured = (uid, current) => {
    if (current) {
      setCompanions(p => p.map(c => c.uid === uid ? { ...c, isFeatured: false, featuredUntil: null } : c));
      toast.success('Removed from featured');
    } else {
      setModal(uid);
    }
  };

  const confirmFeature = () => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    setCompanions(p => p.map(c => c.uid === modal ? { ...c, isFeatured: true, featuredUntil: until.toISOString().split('T')[0] } : c));
    toast.success(`Featured for ${days} days!`);
    setModal(null);
  };

  const featured    = companions.filter(c => c.isFeatured);
  const nonFeatured = companions.filter(c => !c.isFeatured);

  return (
    <AdminLayout title="Featured Control">
      <Head><title>Featured Profiles – Admin</title></Head>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Currently Featured', value: featured.length, color: 'indigo' },
          { label: 'Premium Companions', value: companions.filter(c => c.plan === 'premium').length, color: 'amber' },
          { label: 'Total Companions',   value: companions.length, color: 'emerald' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color === 'indigo' ? 'text-indigo-300' : s.color === 'amber' ? 'text-amber-300' : 'text-emerald-300'}`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Featured */}
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
        <RiStarFillLine className="text-amber-400" /> Currently Featured ({featured.length})
      </h2>
      <div className="glass-card overflow-hidden mb-8">
        <table className="admin-table">
          <thead><tr><th>Companion</th><th>City</th><th>Rate</th><th>Rating</th><th>Plan</th><th>Featured Until</th><th>Action</th></tr></thead>
          <tbody>
            {featured.map(c => (
              <tr key={c.uid}>
                <td>
                  <div className="flex items-center gap-2">
                    <img src={avatarPlaceholder(c.gender, c.uid)} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-sm text-white font-medium">{c.displayName}</span>
                  </div>
                </td>
                <td className="text-sm text-gray-400">{c.city}</td>
                <td className="text-sm text-white">{formatCurrency(c.hourlyRate)}/hr</td>
                <td className="text-sm text-amber-400">⭐ {c.rating}</td>
                <td><span className={c.plan === 'premium' ? 'badge-premium' : 'text-gray-500 text-xs'}>{c.plan}</span></td>
                <td className="text-xs text-gray-400">{c.featuredUntil ? formatDate(c.featuredUntil) : '–'}</td>
                <td>
                  <button onClick={() => toggleFeatured(c.uid, true)} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300">
                    <RiCloseLine /> Remove
                  </button>
                </td>
              </tr>
            ))}
            {featured.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-gray-600">No featured companions</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Non-featured */}
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
        <RiStarLine className="text-gray-500" /> Available to Feature
      </h2>
      <div className="glass-card overflow-hidden">
        <table className="admin-table">
          <thead><tr><th>Companion</th><th>City</th><th>Rate</th><th>Rating</th><th>Plan</th><th>Action</th></tr></thead>
          <tbody>
            {nonFeatured.map(c => (
              <tr key={c.uid}>
                <td>
                  <div className="flex items-center gap-2">
                    <img src={avatarPlaceholder(c.gender, c.uid)} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-sm text-white font-medium">{c.displayName}</span>
                  </div>
                </td>
                <td className="text-sm text-gray-400">{c.city}</td>
                <td className="text-sm text-white">{formatCurrency(c.hourlyRate)}/hr</td>
                <td className="text-sm text-amber-400">⭐ {c.rating}</td>
                <td><span className={c.plan === 'premium' ? 'badge-premium' : 'text-gray-500 text-xs'}>{c.plan}</span></td>
                <td>
                  <button onClick={() => toggleFeatured(c.uid, false)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                    <RiAddLine /> Feature
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Feature Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-2">Feature this profile</h3>
            <p className="text-sm text-gray-500 mb-5">Select how long to feature <strong className="text-white">{companions.find(c => c.uid === modal)?.displayName}</strong></p>
            <div className="flex gap-2 mb-5">
              {BOOST_DAYS.map(d => (
                <button key={d} onClick={() => setDays(d)} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${days === d ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300' : 'glass text-gray-400 hover:text-white'}`}>
                  {d} days
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 btn-ghost">Cancel</button>
              <button onClick={confirmFeature} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <RiStarFillLine /> Feature Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
