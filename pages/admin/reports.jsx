// pages/admin/reports.jsx
import { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';
import { RiEyeLine, RiCloseLine, RiCheckLine, RiUserForbidLine, RiFlag2Line } from 'react-icons/ri';

const REPORT_TYPES = {
  harassment: 'Harassment',
  inappropriate_behavior: 'Inappropriate Behavior',
  fraud: 'Fraud',
  spam: 'Spam',
  other: 'Other',
};

const MOCK_REPORTS = [
  {
    reportId: 'RPT001', reportedByName: 'Rahul Mehta', reportedUserName: 'User X',
    type: 'harassment', description: 'Received inappropriate messages outside the platform.',
    status: 'open', createdAt: { toDate: () => new Date('2025-01-18T10:00:00') },
  },
  {
    reportId: 'RPT002', reportedByName: 'Priya Singh', reportedUserName: 'Companion Y',
    type: 'inappropriate_behavior', description: 'Companion tried to offer adult services during booking.',
    status: 'investigating', createdAt: { toDate: () => new Date('2025-01-17T15:00:00') },
  },
  {
    reportId: 'RPT003', reportedByName: 'Arjun Das', reportedUserName: 'User Z',
    type: 'fraud', description: 'User cancelled after meeting but still asked for refund claiming no-show.',
    status: 'resolved', createdAt: { toDate: () => new Date('2025-01-16T12:00:00') }, adminNote: 'Investigated. No action needed.',
  },
];

const STATUS_CLS = {
  open:          'status-pending',
  investigating: 'status-active',
  resolved:      'status-approved',
  dismissed:     'status-rejected',
};

export default function AdminReportsPage() {
  const [reports,  setReports]  = useState(MOCK_REPORTS);
  const [filter,   setFilter]   = useState('open');
  const [selected, setSelected] = useState(null);
  const [note,     setNote]     = useState('');
  const [busy,     setBusy]     = useState(false);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const counts = {
    all:          reports.length,
    open:         reports.filter(r => r.status === 'open').length,
    investigating:reports.filter(r => r.status === 'investigating').length,
    resolved:     reports.filter(r => r.status === 'resolved').length,
  };

  const updateStatus = async (id, status) => {
    setBusy(true);
    try {
      setReports(p => p.map(r => r.reportId === id ? { ...r, status, adminNote: note } : r));
      toast.success(`Report marked as ${status}`);
      setSelected(null);
      setNote('');
    } catch { toast.error('Failed'); }
    finally { setBusy(false); }
  };

  const blockUser = () => {
    toast.success('User blocked successfully');
    setSelected(null);
  };

  return (
    <AdminLayout title="Reports Management">
      <Head><title>Reports – Admin</title></Head>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl mb-6 w-fit">
        {Object.entries(counts).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === k ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            {k} ({v})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Reported By</th>
                <th>Reported User</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.reportId}>
                  <td className="font-mono text-xs text-rose-400">{r.reportId}</td>
                  <td className="text-sm text-gray-300">{r.reportedByName}</td>
                  <td className="text-sm text-gray-300">{r.reportedUserName}</td>
                  <td><span className="text-xs text-gray-400">{REPORT_TYPES[r.type]}</span></td>
                  <td className="text-xs text-gray-500">{formatDateTime(r.createdAt)}</td>
                  <td><span className={STATUS_CLS[r.status]}>{r.status}</span></td>
                  <td>
                    <button
                      onClick={() => { setSelected(r); setNote(r.adminNote || ''); }}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      <RiEyeLine /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-600">No reports found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-6 w-full max-w-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RiFlag2Line className="text-rose-400 text-xl" />
                  <h2 className="font-semibold text-white">{selected.reportId}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><RiCloseLine size={20} /></button>
              </div>

              <div className="space-y-3 mb-4">
                {[
                  ['Reported By',   selected.reportedByName],
                  ['Reported User', selected.reportedUserName],
                  ['Type',          REPORT_TYPES[selected.type]],
                  ['Submitted',     formatDateTime(selected.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <div className="glass p-3 rounded-xl text-sm text-gray-300">{selected.description}</div>
              </div>

              <div className="mb-5">
                <label className="text-xs text-gray-500 mb-1 block">Admin Note</label>
                <textarea className="glass-input resize-none" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Resolution notes…" />
              </div>

              {selected.status !== 'resolved' && (
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'open' && (
                    <button
                      onClick={() => updateStatus(selected.reportId, 'investigating')}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-all"
                    >
                      Mark Investigating
                    </button>
                  )}
                  <button
                    onClick={blockUser}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1"
                  >
                    <RiUserForbidLine /> Block User
                  </button>
                  <button
                    onClick={() => updateStatus(selected.reportId, 'resolved')}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1"
                  >
                    <RiCheckLine /> {busy ? 'Saving…' : 'Mark Resolved'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
