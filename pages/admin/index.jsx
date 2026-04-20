// pages/admin/index.jsx
import Head from 'next/head';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import {
  RiUserLine, RiUserStarLine, RiCalendarCheckLine,
  RiMoneyDollarCircleLine, RiShieldUserLine, RiFlag2Line,
  RiArrowUpLine, RiArrowRightLine, RiAlertLine,
} from 'react-icons/ri';
import { formatCurrency, formatDateTime } from '../../lib/utils';

// ── Mock analytics (replace with Firestore aggregation in prod) ──────────────
const STATS = [
  { label: 'Total Users',        value: '12,483',  change: '+8.2%',  up: true,  icon: <RiUserLine />,              color: 'indigo' },
  { label: 'Active Companions',  value: '1,247',   change: '+12.5%', up: true,  icon: <RiUserStarLine />,          color: 'emerald' },
  { label: 'Bookings This Month',value: '3,891',   change: '+5.1%',  up: true,  icon: <RiCalendarCheckLine />,     color: 'violet' },
  { label: 'Revenue This Month', value: '₹9.2L',   change: '+18.4%', up: true,  icon: <RiMoneyDollarCircleLine />, color: 'amber' },
  { label: 'Pending KYC',        value: '34',      change: 'Urgent', up: false, icon: <RiShieldUserLine />,        color: 'rose' },
  { label: 'Pending Payments',   value: '67',      change: 'Review', up: false, icon: <RiMoneyDollarCircleLine />, color: 'amber' },
  { label: 'Open Reports',       value: '9',       change: 'Action', up: false, icon: <RiFlag2Line />,             color: 'rose' },
  { label: 'Avg. Rating',        value: '4.85',    change: '+0.03',  up: true,  icon: <RiArrowUpLine />,           color: 'emerald' },
];

const RECENT_BOOKINGS = [
  { id: 'BK001', user: 'Rahul Mehta',  companion: 'Priya S.',   amount: 2400, status: 'confirmed',            date: '2025-01-18 14:30' },
  { id: 'BK002', user: 'Arjun Das',    companion: 'Ananya R.',  amount: 3200, status: 'pending_verification', date: '2025-01-18 13:15' },
  { id: 'BK003', user: 'Vikram Nair',  companion: 'Riya P.',    amount: 1600, status: 'pending_payment',      date: '2025-01-18 12:00' },
  { id: 'BK004', user: 'Kiran Joshi',  companion: 'Meera I.',   amount: 4800, status: 'completed',            date: '2025-01-17 18:00' },
  { id: 'BK005', user: 'Sanjay Reddy', companion: 'Simran K.',  amount: 2000, status: 'cancelled',            date: '2025-01-17 10:30' },
];

const RECENT_KYC = [
  { name: 'Rohan Sharma',   city: 'Mumbai',    time: '2 hours ago',   status: 'pending' },
  { name: 'Kavya Iyer',     city: 'Bangalore', time: '4 hours ago',   status: 'pending' },
  { name: 'Dev Malhotra',   city: 'Delhi',     time: '6 hours ago',   status: 'pending' },
];

const STATUS_MAP = {
  confirmed:            { label: 'Confirmed',          cls: 'status-approved' },
  pending_verification: { label: 'Awaiting Verification', cls: 'status-pending' },
  pending_payment:      { label: 'Pending Payment',    cls: 'status-pending' },
  completed:            { label: 'Completed',          cls: 'status-approved' },
  cancelled:            { label: 'Cancelled',          cls: 'status-rejected' },
};

const COLOR_MAP = {
  indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  violet:  'bg-violet-500/10 border-violet-500/20 text-violet-400',
  amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  rose:    'bg-rose-500/10 border-rose-500/20 text-rose-400',
};

export default function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard Overview">
      <Head><title>Admin Dashboard – Companio</title></Head>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="glass-card p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${COLOR_MAP[s.color]}`}>
                {s.icon}
              </div>
              <span className={`text-xs font-semibold ${s.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {s.change}
              </span>
            </div>
            <div className="font-display font-bold text-2xl text-white mb-0.5">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Recent Bookings ── */}
        <div className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <RiArrowRightLine />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>User</th>
                  <th>Companion</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_BOOKINGS.map((b) => {
                  const meta = STATUS_MAP[b.status] || { label: b.status, cls: 'status-pending' };
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="font-mono text-xs text-indigo-400">{b.id}</div>
                        <div className="text-[10px] text-gray-600">{b.date}</div>
                      </td>
                      <td className="text-sm text-gray-300">{b.user}</td>
                      <td className="text-sm text-gray-300">{b.companion}</td>
                      <td className="text-sm font-semibold text-white">{formatCurrency(b.amount)}</td>
                      <td><span className={meta.cls}>{meta.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* Pending KYC */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Pending KYC</h2>
              <Link href="/admin/kyc" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                Review <RiArrowRightLine />
              </Link>
            </div>
            <div className="space-y-3">
              {RECENT_KYC.map((k) => (
                <div key={k.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                      {k.name[0]}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{k.name}</div>
                      <div className="text-xs text-gray-500">{k.city} · {k.time}</div>
                    </div>
                  </div>
                  <span className="status-pending">Pending</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Review KYC Applications', href: '/admin/kyc',      icon: <RiShieldUserLine />, urgent: true  },
                { label: 'Verify Payments',          href: '/admin/payments', icon: <RiMoneyDollarCircleLine />, urgent: true  },
                { label: 'Handle Reports',           href: '/admin/reports',  icon: <RiFlag2Line />,     urgent: false },
                { label: 'Manage Featured Profiles', href: '/admin/featured', icon: <RiArrowUpLine />,   urgent: false },
              ].map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    a.urgent
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20'
                      : 'glass text-gray-300 hover:text-white'
                  }`}
                >
                  <span className="text-base">{a.icon}</span>
                  {a.label}
                  {a.urgent && <RiAlertLine className="ml-auto text-rose-400" />}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
