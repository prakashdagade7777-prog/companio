// pages/admin/kyc.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, orderBy, getDocs,
  updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatDateTime, KYC_META } from '../../lib/utils';
import toast from 'react-hot-toast';
import {
  RiCheckLine, RiCloseLine, RiEyeLine, RiSearchLine,
  RiShieldUserLine, RiRefreshLine,
} from 'react-icons/ri';

// ── Mock KYC data ─────────────────────────────────────────────────────────────
const MOCK_KYC = [
  {
    uid: 'u1', name: 'Priya Sharma',   city: 'Mumbai',    aadhaarNumber: '1234 5678 9012',
    aadhaarFront: 'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Front',
    aadhaarBack:  'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Back',
    selfieUrl:    'https://api.dicebear.com/8.x/adventurer/svg?seed=priya&backgroundColor=1e1e3f',
    status: 'pending', submittedAt: { toDate: () => new Date('2025-01-18T10:30:00') },
  },
  {
    uid: 'u2', name: 'Arjun Mehta',    city: 'Delhi',     aadhaarNumber: '9876 5432 1098',
    aadhaarFront: 'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Front',
    aadhaarBack:  'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Back',
    selfieUrl:    'https://api.dicebear.com/8.x/avataaars/svg?seed=arjun&backgroundColor=1e1e3f',
    status: 'pending', submittedAt: { toDate: () => new Date('2025-01-18T08:00:00') },
  },
  {
    uid: 'u3', name: 'Kavya Iyer',     city: 'Bangalore', aadhaarNumber: '5555 4444 3333',
    aadhaarFront: 'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Front',
    aadhaarBack:  'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Back',
    selfieUrl:    'https://api.dicebear.com/8.x/adventurer/svg?seed=kavya&backgroundColor=1e1e3f',
    status: 'approved', submittedAt: { toDate: () => new Date('2025-01-17T14:00:00') },
  },
  {
    uid: 'u4', name: 'Rohan Das',      city: 'Chennai',   aadhaarNumber: '1111 2222 3333',
    aadhaarFront: 'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Front',
    aadhaarBack:  'https://placehold.co/400x250/1a1a2e/6366f1?text=Aadhaar+Back',
    selfieUrl:    'https://api.dicebear.com/8.x/avataaars/svg?seed=rohan&backgroundColor=1e1e3f',
    status: 'rejected', submittedAt: { toDate: () => new Date('2025-01-17T09:00:00') }, adminNote: 'Documents unclear.',
  },
];

export default function AdminKYCPage() {
  const [records,    setRecords]    = useState(MOCK_KYC);
  const [filter,     setFilter]     = useState('pending');
  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const [note,       setNote]       = useState('');
  const [busy,       setBusy]       = useState(false);

  const filtered = records.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = async (uid, status) => {
    setBusy(true);
    try {
      // In production:
      // await updateDoc(doc(db, 'kyc', uid), { status, adminNote: note, reviewedAt: serverTimestamp() });
      // if (status === 'approved') {
      //   await updateDoc(doc(db, 'companions', uid), { isVerified: true, isActive: true });
      // }
      setRecords(p => p.map(r => r.uid === uid ? { ...r, status, adminNote: note } : r));
      toast.success(`KYC ${status} for ${selected?.name}`);
      setSelected(null);
      setNote('');
    } catch (err) {
      toast.error('Action failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const counts = {
    all:      records.length,
    pending:  records.filter(r => r.status === 'pending').length,
    approved: records.filter(r => r.status === 'approved').length,
    rejected: records.filter(r => r.status === 'rejected').length,
  };

  return (
    <AdminLayout title="KYC Review">
      <Head><title>KYC Review – Admin</title></Head>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 glass rounded-xl">
          {Object.entries(counts).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 flex items-center gap-1.5 ${
                filter === k ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              {k}
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                filter === k ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-500'
              }`}>{v}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="glass-input pl-9 w-56 text-sm"
            placeholder="Search name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Companion</th>
                <th>Aadhaar</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const meta = KYC_META[r.status];
                return (
                  <tr key={r.uid}>
                    <td>
                      <div className="flex items-center gap-2">
                        <img src={r.selfieUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="text-sm font-medium text-white">{r.name}</div>
                          <div className="text-xs text-gray-500">{r.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-gray-400">{r.aadhaarNumber}</td>
                    <td className="text-xs text-gray-500">{formatDateTime(r.submittedAt)}</td>
                    <td><span className={meta.cls}>{meta.label}</span></td>
                    <td>
                      <button
                        onClick={() => { setSelected(r); setNote(r.adminNote || ''); }}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <RiEyeLine /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-600">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-white text-lg">{selected.name}</h2>
                  <p className="text-xs text-gray-500">{selected.city} · Submitted {formatDateTime(selected.submittedAt)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><RiCloseLine size={20} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Aadhaar Front', src: selected.aadhaarFront },
                  { label: 'Aadhaar Back',  src: selected.aadhaarBack  },
                  { label: 'Selfie',         src: selected.selfieUrl    },
                ].map(img => (
                  <div key={img.label}>
                    <div className="text-xs text-gray-500 mb-1">{img.label}</div>
                    <img src={img.src} alt={img.label} className="w-full rounded-xl object-cover border border-white/10" />
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Aadhaar Number</div>
                <div className="font-mono text-white text-base tracking-widest glass p-3 rounded-xl">{selected.aadhaarNumber}</div>
              </div>

              <div className="mb-5">
                <label className="text-xs text-gray-500 mb-1 block">Admin Note (optional)</label>
                <textarea
                  className="glass-input resize-none"
                  rows={3}
                  placeholder="Add a note about this application…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {selected.status === 'pending' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(selected.uid, 'rejected')}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    <RiCloseLine /> Reject
                  </button>
                  <button
                    onClick={() => handleAction(selected.uid, 'approved')}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    <RiCheckLine /> {busy ? 'Processing…' : 'Approve & Verify'}
                  </button>
                </div>
              ) : (
                <div className={`text-center py-3 rounded-xl text-sm font-semibold ${KYC_META[selected.status].cls}`}>
                  {KYC_META[selected.status].label}
                  {selected.adminNote && <div className="text-xs opacity-70 mt-1">Note: {selected.adminNote}</div>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
