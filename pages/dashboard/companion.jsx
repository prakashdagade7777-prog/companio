// pages/dashboard/companion.jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, STATUS_META } from '../../lib/utils';
import {
  RiCalendarCheckLine, RiStarFillLine, RiMoneyDollarCircleLine,
  RiShieldCheckLine, RiCrownLine, RiEditLine, RiArrowRightLine,
  RiAlertLine, RiCheckboxCircleLine,
} from 'react-icons/ri';

const MOCK_DATA = {
  kycStatus: 'pending',
  plan: 'free',
  bookingsCount: 12,
  rating: 4.7,
  reviewCount: 8,
  totalEarnings: 14400,
  thisMonthEarnings: 5600,
  pendingBookings: [
    { bookingId: 'BK10', userSnapshot: { name: 'Rahul M.' }, date: '2025-01-22', hours: 3, occasion: 'Corporate Dinner', totalAmount: 2400, status: 'confirmed' },
    { bookingId: 'BK11', userSnapshot: { name: 'Vikram S.' }, date: '2025-01-25', hours: 2, occasion: 'Wedding',        totalAmount: 1600, status: 'confirmed' },
  ],
};

export default function CompanionDashboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('overview');
  const name = profile?.name || user?.displayName || 'Companion';

  const kycStatusInfo = {
    pending:  { cls: 'status-pending',  msg: 'Your KYC is under review. You\'ll be notified within 24 hours.',    icon: <RiAlertLine /> },
    approved: { cls: 'status-approved', msg: 'Your identity is verified. Your profile is live!',                    icon: <RiCheckboxCircleLine /> },
    rejected: { cls: 'status-rejected', msg: 'KYC rejected. Please resubmit with clear documents.',                icon: <RiAlertLine /> },
  }[MOCK_DATA.kycStatus];

  return (
    <>
      <Head><title>Companion Dashboard – Companio</title></Head>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white mb-1">
              {name.split(' ')[0]}'s Dashboard
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className={kycStatusInfo.cls}>{MOCK_DATA.kycStatus === 'approved' ? '✅ Verified' : `KYC: ${MOCK_DATA.kycStatus}`}</span>
              <span className="text-gray-600">·</span>
              <span className={MOCK_DATA.plan === 'premium' ? 'text-amber-400' : 'text-gray-500'}>
                {MOCK_DATA.plan === 'premium' ? '💎 Premium' : '🆓 Free Plan'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {MOCK_DATA.plan === 'free' && (
              <Link href="/pricing" className="btn-primary flex items-center gap-2">
                <RiCrownLine /> Upgrade to Premium
              </Link>
            )}
            <Link href="/dashboard/companion/profile" className="btn-ghost flex items-center gap-2">
              <RiEditLine /> Edit Profile
            </Link>
          </div>
        </div>

        {/* KYC Banner */}
        {MOCK_DATA.kycStatus !== 'approved' && (
          <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 border ${
            MOCK_DATA.kycStatus === 'pending' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
            'bg-rose-500/5 border-rose-500/20 text-rose-400'
          }`}>
            <span className="text-xl">{kycStatusInfo.icon}</span>
            <div className="flex-1 text-sm">{kycStatusInfo.msg}</div>
            {MOCK_DATA.kycStatus === 'rejected' && (
              <Link href="/kyc" className="btn-primary text-xs px-4 py-2">Resubmit KYC</Link>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings',     value: MOCK_DATA.bookingsCount,                icon: <RiCalendarCheckLine />, color: 'indigo' },
            { label: 'Rating',             value: `${MOCK_DATA.rating}⭐`,               icon: <RiStarFillLine />,      color: 'amber' },
            { label: 'Total Earnings',     value: formatCurrency(MOCK_DATA.totalEarnings), icon: <RiMoneyDollarCircleLine />, color: 'emerald' },
            { label: 'This Month',         value: formatCurrency(MOCK_DATA.thisMonthEarnings), icon: <RiMoneyDollarCircleLine />, color: 'violet' },
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
                s.color === 'indigo'  ? 'text-indigo-300' :
                s.color === 'amber'   ? 'text-amber-300'  :
                s.color === 'emerald' ? 'text-emerald-300': 'text-violet-300'
              }`}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass rounded-xl mb-6 w-fit">
          {['overview', 'bookings', 'earnings'].map(t => (
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

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Bookings */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-4">Upcoming Bookings</h2>
              {MOCK_DATA.pendingBookings.length > 0 ? (
                <div className="space-y-3">
                  {MOCK_DATA.pendingBookings.map(b => {
                    const meta = STATUS_META[b.status];
                    return (
                      <div key={b.bookingId} className="p-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white">{b.userSnapshot.name}</span>
                          <span className={meta?.cls || 'status-pending'}>{meta?.label || b.status}</span>
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(b.date)} · {b.hours}hr · {b.occasion}</div>
                        <div className="text-sm font-semibold text-emerald-400 mt-1">{formatCurrency(b.totalAmount)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No upcoming bookings yet.</p>
              )}
            </div>

            {/* Plan Benefits */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-4">Your Plan</h2>
              {MOCK_DATA.plan === 'free' ? (
                <>
                  <div className="space-y-2 text-sm text-gray-400 mb-5">
                    <p>✓ Up to 5 active bookings/month</p>
                    <p>✗ No priority listing</p>
                    <p>✗ No featured profile boost</p>
                    <p>✗ No premium badge</p>
                  </div>
                  <Link href="/pricing" className="btn-primary w-full text-center block">
                    Upgrade to Premium →
                  </Link>
                </>
              ) : (
                <div className="space-y-2 text-sm text-emerald-400">
                  <p>✓ Unlimited bookings</p>
                  <p>✓ Priority listing in search</p>
                  <p>✓ Featured profile boost</p>
                  <p>✓ 💎 Premium badge</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">All Bookings</h2>
            <div className="space-y-3">
              {MOCK_DATA.pendingBookings.map(b => {
                const meta = STATUS_META[b.status];
                return (
                  <div key={b.bookingId} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div>
                      <div className="text-sm font-semibold text-white">{b.userSnapshot.name}</div>
                      <div className="text-xs text-gray-500">{formatDate(b.date)} · {b.occasion}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{formatCurrency(b.totalAmount)}</div>
                      <span className={meta?.cls || 'status-pending'}>{meta?.label || b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'earnings' && (
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Earnings Overview</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Earnings (All time)', value: formatCurrency(MOCK_DATA.totalEarnings) },
                { label: 'This Month', value: formatCurrency(MOCK_DATA.thisMonthEarnings) },
                { label: 'Platform Commission (15%)', value: formatCurrency(MOCK_DATA.totalEarnings * 0.15) },
                { label: 'Net Payout', value: formatCurrency(MOCK_DATA.totalEarnings * 0.85) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-4">Payouts are processed weekly every Monday via bank transfer.</p>
          </div>
        )}
      </div>
    </>
  );
}
