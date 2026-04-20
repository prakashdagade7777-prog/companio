// components/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  RiDashboardLine, RiShieldUserLine, RiMoneyDollarCircleLine,
  RiCalendarCheckLine, RiFlag2Line, RiUserStarLine,
  RiSettings3Line, RiLogoutBoxLine, RiMenuLine, RiCloseLine,
  RiStarLine, RiBarChartLine,
} from 'react-icons/ri';

const NAV = [
  { href: '/admin',                icon: <RiDashboardLine />,          label: 'Dashboard',        badge: null },
  { href: '/admin/kyc',            icon: <RiShieldUserLine />,          label: 'KYC Review',       badge: 'kyc' },
  { href: '/admin/payments',       icon: <RiMoneyDollarCircleLine />,   label: 'Payments',         badge: 'payments' },
  { href: '/admin/bookings',       icon: <RiCalendarCheckLine />,       label: 'Bookings',         badge: null },
  { href: '/admin/companions',     icon: <RiUserStarLine />,            label: 'Companions',       badge: null },
  { href: '/admin/users',          icon: <RiBarChartLine />,            label: 'Users',            badge: null },
  { href: '/admin/reports',        icon: <RiFlag2Line />,               label: 'Reports',          badge: 'reports' },
  { href: '/admin/featured',       icon: <RiStarLine />,                label: 'Featured Control', badge: null },
  { href: '/admin/settings',       icon: <RiSettings3Line />,           label: 'Settings',         badge: null },
];

const BADGE_COUNTS = { kyc: 3, payments: 7, reports: 2 };

export default function AdminLayout({ children, title }) {
  const { profile, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Guard
  useEffect(() => {
    if (profile && !isAdmin) router.push('/');
  }, [profile, isAdmin]);

  return (
    <div className="min-h-screen flex bg-brand-black">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 glass-nav border-r border-indigo-500/10 fixed inset-y-0 left-0 z-40">
        <SidebarContent router={router} logout={logout} profile={profile} />
      </aside>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-64 glass-nav border-r border-indigo-500/10 z-50 flex flex-col lg:hidden"
            >
              <SidebarContent router={router} logout={logout} profile={profile} onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="glass-nav border-b border-indigo-500/10 h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              <RiMenuLine size={20} />
            </button>
            <h1 className="font-semibold text-white text-sm">{title || 'Admin Panel'}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">Logged in as</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">{profile?.name?.split(' ')[0] || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ router, logout, profile, onClose }) {
  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">C</div>
          <span className="font-display font-bold text-base text-white">Admin</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold">PANEL</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <RiCloseLine size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const isActive = router.pathname === item.href || (item.href !== '/admin' && router.pathname.startsWith(item.href));
          const count    = item.badge ? BADGE_COUNTS[item.badge] : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className={`text-lg ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={logout}
          className="sidebar-link w-full text-rose-400 hover:bg-rose-500/10"
        >
          <RiLogoutBoxLine className="text-lg" />
          Sign Out
        </button>
      </div>
    </>
  );
}
