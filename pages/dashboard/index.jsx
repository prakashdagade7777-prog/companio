// pages/dashboard/index.jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, STATUS_META } from '../../lib/utils';
import {
  RiCalendarCheckLine, RiStarLine, RiUserLine,
  RiArrowRightLine, RiShieldCheckLine, RiCrownLine,
  RiMapPin2Line, RiTimeLine,
} from 'react-icons/ri';

const MOCK_BOOKINGS = [
  {
    bookingId: 'BK001', companionSnapshot: { displayName: 'Priya Sharma' },
    date: '2025-01-20', startTime: '18:00', hours: 3, occasion: 'Corporate Dinner',
    location: 'Taj Hotel, Mumbai', totalAmount: 2880, status: 'confirmed',
  },
  {
    bookingId: 'BK002', companionSnapshot: { displayName: 'Ananya Roy' },
    date: '2025-01-15', startTime: '14:00', hours: 2, occasion: 'Shopping',
    location: 'Phoenix Mall, Bangalore', totalAmount: 1600, status: 'completed',
  },
  {
    bookingId: 'BK003', companionSnapshot: { displayName: 'Riya Patel' },
    date: '2025-01-25', startTime: '20:00', hours: 4, occasion: 'Birthday Party',
    location: 'Delhi NCR', totalAmount: 3600, status: 'pending_payment',
  },
];

export default function UserDashboard() {
  const { user, profile, isPremium } = useAuth();
  const [tab, setTab] = useState('bookings');

  const name = profile?.name || user?.displayName || 'User';

  return (
    <>
      <Head><title>My Dashboard – Companio</title></Head>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display font-bold text-3xl text-white mb-1">
              Hello, {name.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm">
              {isPremium
                ? <span className="text-amber-400 font-semibold">💎 Premium Member</span>
                : 'Free account · Upgrade to get priority bookings'}
            </p>
          </div>
          <div className="flex gap-3">
            {!isPremium && (
              <Link href="/pricing" className="btn-primary flex items-center gap-2">
                <RiCrownLine /> Upgrade to Premium
              </Link>
            )}
            <Link href="/companions" className="btn-ghost flex items-center gap-2">
              Browse Companions <RiArrowRightLine />
            </Link>
          </div>
        </motion.div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: MOCK_BOOKINGS.length, icon: <RiCalendarCheckLine />, color: 'indigo' },
            { label: 'Completed',      value: MOCK_BOOKINGS.filter(b => b.status === 'completed').length, icon: <RiShieldCheckLine />, color: 'emerald' },
            { label: 'Total Spent',    value: formatCurrency(MOCK_BOOKINGS.reduce((s, b) => s + b.totalAmount, 0)), icon: null, color: 'violet' },
            { label: 'Plan',           value: isPremium ? 'Premium' : 'Free', icon: <RiCrownLine />, color: 'amber' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-4"
            >
              <div className="text-xs text-gray-500 mb-2">{s.label}</div>
              <div className={`font-bold text-xl ${
                s.color === 'indigo' ? 'text-indigo-300' :
                s.color === 'emerald' ? 'text-emerald-300' :
                s.color === 'violet' ? 'text-violet-300' : 'text-amber-300'
              }`}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 glass rounded-xl mb-6 w-fit">
          {['bookings', 'profile', 'safety'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {MOCK_BOOKINGS.map((b, i) => {
              const meta = STATUS_META[b.status] || { label: b.status, cls: 'status-pending' };
              return (
                <motion.div
                  key={b.bookingId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card p-5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{b.companionSnapshot.displayName}</h3>
                        <span className={meta.cls}>{meta.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><RiCalendarCheckLine />{formatDate(b.date)}</span>
                        <span className="flex items-center gap-1"><RiTimeLine />{b.startTime} · {b.hours}hr</span>
                        <span className="flex items-center gap-1"><RiMapPin2Line />{b.location}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Occasion: {b.occasion}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{formatCurrency(b.totalAmount)}</div>
                      {b.status === 'pending_payment' && (
                        <Link href={`/payment/upload?booking=${b.bookingId}&amount=${b.totalAmount}`} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 block">
                          Pay Now →
                        </Link>
                      )}
                      {b.status === 'completed' && (
                        <button className="text-xs text-amber-400 hover:text-amber-300 mt-1 block">
                          Leave Review →
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {tab === 'profile' && (
          <div className="glass-card p-6 max-w-lg">
            <h2 className="font-semibold text-white mb-5">My Profile</h2>
            <div className="space-y-4">
              {[
                { label: 'Full Name',      value: profile?.name || '–' },
                { label: 'Email',          value: user?.email || '–' },
                { label: 'Phone',          value: profile?.phone || '–' },
                { label: 'Member Since',   value: profile?.createdAt ? formatDate(profile.createdAt.toDate()) : '–' },
                { label: 'Account Type',   value: isPremium ? '💎 Premium' : '🆓 Free' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
              <button className="btn-ghost w-full mt-3 flex items-center justify-center gap-2">
                <RiUserLine /> Edit Profile
              </button>
            </div>
          </div>
        )}

        {tab === 'safety' && (
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <RiShieldCheckLine className="text-emerald-400" /> Safety Center
              </h2>
              <div className="space-y-3 text-sm text-gray-400">
                <p>✅ All companions are KYC verified before activation.</p>
                <p>✅ Payments are verified by admin before bookings are confirmed.</p>
                <p>🚫 No adult services are permitted. Any violation results in permanent ban.</p>
                <p>📞 24/7 safety monitoring team available for urgent issues.</p>
              </div>
            </div>
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4">Report an Issue</h2>
              <Link href="/report" className="btn-primary flex items-center justify-center gap-2">
                File a Report
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
