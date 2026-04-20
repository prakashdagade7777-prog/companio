// components/Navbar.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { cn, getInitials } from '../lib/utils';
import {
  RiCompassDiscoverLine, RiUserLine, RiMenuLine, RiCloseLine,
  RiShieldCheckLine, RiSettings3Line, RiLogoutBoxLine,
  RiDashboardLine, RiAdminLine, RiArrowDownSLine,
} from 'react-icons/ri';

const NAV_LINKS = [
  { href: '/companions', label: 'Find Companions' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/safety',      label: 'Safety' },
  { href: '/pricing',     label: 'Pricing' },
];

export default function Navbar() {
  const { user, profile, logout, isAdmin, isCompanion } = useAuth();
  const router   = useRouter();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [router.pathname]);

  const dashboardHref = isAdmin ? '/admin' : isCompanion ? '/dashboard/companion' : '/dashboard';

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'glass-nav shadow-lg' : 'bg-transparent',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">C</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                Companio
                <span className="text-gradient ml-0.5">.</span>
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    router.pathname.startsWith(link.href)
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <Link href="/auth/login" className="hidden sm:block btn-ghost text-sm px-4 py-2">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
                    Get Started
                  </Link>
                </>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass hover:border-indigo-500/30 transition-all duration-200"
                  >
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(profile?.name || user.displayName || 'U')}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[100px] truncate">
                      {profile?.name?.split(' ')[0] || 'Account'}
                    </span>
                    <RiArrowDownSLine className={cn('text-gray-400 transition-transform', profileOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 glass-card p-2"
                      >
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                          <p className="text-sm font-semibold text-white truncate">{profile?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <MenuItem href={dashboardHref} icon={<RiDashboardLine />} label="Dashboard" />
                        {isAdmin && <MenuItem href="/admin" icon={<RiAdminLine />} label="Admin Panel" />}
                        <MenuItem href="/dashboard/profile" icon={<RiUserLine />} label="My Profile" />
                        <MenuItem href="/dashboard/settings" icon={<RiSettings3Line />} label="Settings" />
                        <div className="my-1 divider" />
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <RiLogoutBoxLine className="text-base" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── Mobile Hamburger ── */}
              <button
                onClick={() => setMobileOpen(p => !p)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-nav border-t border-white/5"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <div className="pt-3 flex gap-2">
                    <Link href="/auth/login"    className="flex-1 btn-ghost text-center">Sign In</Link>
                    <Link href="/auth/register" className="flex-1 btn-primary text-center">Get Started</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Click outside to close profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </>
  );
}

function MenuItem({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
    >
      <span className="text-indigo-400 text-base">{icon}</span>
      {label}
    </Link>
  );
}
