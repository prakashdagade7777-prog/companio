// pages/report.jsx
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { RiFlag2Line, RiCheckboxCircleLine, RiShieldCheckLine } from 'react-icons/ri';
import { v4 as uuid } from 'uuid';

const TYPES = [
  { val: 'harassment',             label: '🚨 Harassment' },
  { val: 'inappropriate_behavior', label: '⚠️ Inappropriate Behavior' },
  { val: 'fraud',                  label: '💸 Fraud / Scam' },
  { val: 'adult_services',         label: '🚫 Adult Service Solicitation' },
  { val: 'spam',                   label: '📧 Spam' },
  { val: 'other',                  label: '📋 Other' },
];

export default function ReportPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const { uid }  = router.query;

  const [form, setForm]   = useState({ reportedUser: uid || '', type: '', description: '' });
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return router.push('/auth/login');
    if (!form.type) return toast.error('Please select a report type');
    if (!form.description.trim()) return toast.error('Please describe the issue');
    if (form.description.trim().length < 20) return toast.error('Please provide more details (min 20 characters)');

    setBusy(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reportId:      uuid(),
        reportedBy:    user.uid,
        reportedUser:  form.reportedUser,
        type:          form.type,
        description:   form.description.trim(),
        status:        'open',
        adminNote:     '',
        createdAt:     serverTimestamp(),
        resolvedAt:    null,
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <RiCheckboxCircleLine className="text-emerald-400 text-3xl" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-3">Report Submitted</h2>
          <p className="text-gray-400 text-sm mb-6">
            Thank you for helping keep Companio safe. Our safety team will review your report within 24 hours.
          </p>
          <button onClick={() => router.back()} className="btn-primary w-full py-3">← Go Back</button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Report a User – Companio</title></Head>
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <RiFlag2Line className="text-rose-400 text-2xl" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Report a User</h1>
          <p className="text-gray-500 text-sm">Help us keep Companio safe for everyone. False reports may result in account suspension.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Reported User ID (optional)</label>
            <input
              type="text"
              className="glass-input font-mono text-sm"
              placeholder="User ID or leave blank if unknown"
              value={form.reportedUser}
              onChange={e => setForm(p => ({ ...p, reportedUser: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Report Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: t.val }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-200 ${
                    form.type === t.val
                      ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                      : 'glass text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Describe the Issue *</label>
            <textarea
              className="glass-input resize-none"
              rows={5}
              placeholder="Please describe what happened in detail. Include dates, times, and any relevant information…"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-600">Minimum 20 characters</span>
              <span className="text-xs text-gray-600">{form.description.length} chars</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-600">
            <RiShieldCheckLine className="text-base mt-0.5 shrink-0" />
            Your report is confidential. Our safety team will review it within 24 hours and take appropriate action.
          </div>

          <button type="submit" disabled={busy || !form.type || !form.description} className="btn-primary w-full py-4 disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </>
  );
}
