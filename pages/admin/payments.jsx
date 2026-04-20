// pages/admin/payments.jsx
import { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';
import { RiCheckLine, RiCloseLine, RiEyeLine, RiSearchLine, RiExternalLinkLine } from 'react-icons/ri';

const MOCK_PAYMENTS = [
  {
    paymentId: 'PAY001', bookingId: 'BK002', userId: 'u10', userName: 'Arjun Das',
    companionName: 'Ananya Roy', amount: 3200, utrNumber: '421801234567890',
    screenshotUrl: 'https://placehold.co/400x600/0f172a/6366f1?text=UPI+Screenshot',
    status: 'pending', submittedAt: { toDate: () => new Date('2025-01-18T13:15:00') },
  },
  {
    paymentId: 'PAY002', bookingId: 'BK005', userId: 'u12', userName: 'Priya Singh',
    companionName: 'Meera Iyer', amount: 2400, utrNumber: '318902345678901',
    screenshotUrl: 'https://placehold.co/400x600/0f172a/6366f1?text=Bank+Transfer',
    status: 'pending', submittedAt: { toDate: () => new Date('2025-01-18T11:00:00') },
  },
  {
    paymentId: 'PAY003', bookingId: 'BK001', userId: 'u8',  userName: 'Rahul Mehta',
    companionName: 'Priya Sharma', amount: 2400, utrNumber: '217803456789012',
    screenshotUrl: 'https://placehold.co/400x600/0f172a/6366f1?text=UPI+Screenshot',
    status: 'approved', submittedAt: { toDate: () => new Date('2025-01-17T18:00:00') },
  },
  {
    paymentId: 'PAY004', bookingId: 'BK007', userId: 'u15', userName: 'Kiran Joshi',
    companionName: 'Simran Kaur', amount: 4800, utrNumber: '115604567890123',
    screenshotUrl: 'https://placehold.co/400x600/0f172a/6366f1?text=NEFT+Transfer',
    status: 'rejected', submittedAt: { toDate: () => new Date('2025-01-17T09:30:00') }, adminNote: 'UTR not found in bank records.',
  },
];

export default function AdminPaymentsPage() {
  const [payments,  setPayments]  = useState(MOCK_PAYMENTS);
  const [filter,    setFilter]    = useState('pending');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);
  const [note,      setNote]      = useState('');
  const [busy,      setBusy]      = useState(false);

  const filtered = payments.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.userName.toLowerCase().includes(search.toLowerCase()) &&
        !p.utrNumber.includes(search)) return false;
    return true;
  });

  const counts = {
    all:      payments.length,
    pending:  payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  const handleAction = async (paymentId, status) => {
    setBusy(true);
    try {
      // In production:
      // await updateDoc(doc(db, 'payments', paymentId), { status, adminNote: note, verifiedAt: serverTimestamp() });
      // if (status === 'approved') {
      //   await updateDoc(doc(db, 'bookings', selected.bookingId), { status: 'confirmed', updatedAt: serverTimestamp() });
      // }
      setPayments(p => p.map(x => x.paymentId === paymentId ? { ...x, status, adminNote: note } : x));
      toast.success(`Payment ${status}!`);
      setSelected(null);
      setNote('');
    } catch {
      toast.error('Failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const STATUS_STYLE = {
    pending:  'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
  };

  return (
    <AdminLayout title="Payment Verification">
      <Head><title>Payments – Admin</title></Head>

      {/* Filters */}
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
          <input className="glass-input pl-9 w-56 text-sm" placeholder="Search UTR or name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>User</th>
                <th>Companion</th>
                <th>Amount</th>
                <th>UTR Number</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.paymentId}>
                  <td className="font-mono text-xs text-indigo-400">{p.paymentId}</td>
                  <td className="text-sm text-gray-300">{p.userName}</td>
                  <td className="text-sm text-gray-300">{p.companionName}</td>
                  <td className="font-semibold text-white">{formatCurrency(p.amount)}</td>
                  <td className="font-mono text-xs text-gray-400">{p.utrNumber}</td>
                  <td className="text-xs text-gray-500">{formatDateTime(p.submittedAt)}</td>
                  <td><span className={STATUS_STYLE[p.status] || 'status-pending'}>{p.status}</span></td>
                  <td>
                    <button
                      onClick={() => { setSelected(p); setNote(p.adminNote || ''); }}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      <RiEyeLine /> Review
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-600">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Review Modal ── */}
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
              className="glass-card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-white">Payment Review</h2>
                  <p className="text-xs text-gray-500 font-mono">{selected.paymentId}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><RiCloseLine size={20} /></button>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-5">
                {[
                  ['User',        selected.userName],
                  ['Companion',   selected.companionName],
                  ['Booking ID',  selected.bookingId],
                  ['Amount',      formatCurrency(selected.amount)],
                  ['UTR Number',  selected.utrNumber],
                  ['Submitted',   formatDateTime(selected.submittedAt)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-white/5 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className={`font-medium ${k === 'Amount' ? 'text-gradient font-bold text-base' : 'text-white font-mono'}`}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Screenshot */}
              <div className="mb-5">
                <div className="text-xs text-gray-500 mb-2">Payment Screenshot</div>
                <img
                  src={selected.screenshotUrl}
                  alt="Payment Screenshot"
                  className="w-full rounded-xl border border-white/10 max-h-64 object-contain bg-brand-darker"
                />
                <a href={selected.screenshotUrl} target="_blank" rel="noopener" className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
                  <RiExternalLinkLine /> Open full size
                </a>
              </div>

              {/* Admin Note */}
              <div className="mb-5">
                <label className="text-xs text-gray-500 mb-1 block">Admin Note</label>
                <textarea
                  className="glass-input resize-none"
                  rows={2}
                  placeholder="Reason for approval/rejection…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {selected.status === 'pending' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(selected.paymentId, 'rejected')}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    <RiCloseLine /> Reject
                  </button>
                  <button
                    onClick={() => handleAction(selected.paymentId, 'approved')}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    <RiCheckLine /> {busy ? 'Processing…' : 'Approve & Confirm Booking'}
                  </button>
                </div>
              ) : (
                <div className={`text-center py-3 rounded-xl text-sm font-semibold ${STATUS_STYLE[selected.status]}`}>
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
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
