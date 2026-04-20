// pages/auth/register.jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  RiUserLine, RiMailLine, RiPhoneLine, RiLockPasswordLine,
  RiEyeLine, RiEyeOffLine, RiUserStarLine, RiShieldCheckLine,
} from 'react-icons/ri';
import { validateEmail, validatePhone } from '../../lib/utils';

export default function RegisterPage() {
  const { register } = useAuth();
  const router       = useRouter();
  const defaultRole  = router.query.role === 'companion' ? 'companion' : 'user';

  const [role,   setRole]   = useState(defaultRole);
  const [show,   setShow]   = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [form,   setForm]   = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) return toast.error('Please fill all required fields');
    if (!validateEmail(form.email))   return toast.error('Invalid email address');
    if (!validatePhone(form.phone))   return toast.error('Enter a valid 10-digit phone number');
    if (form.password.length < 8)     return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role });
      toast.success('Account created! Welcome to Companio 🎉');
      router.push(role === 'companion' ? '/kyc' : '/companions');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') toast.error('This email is already registered.');
      else toast.error('Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head><title>Join Companio – Sign Up</title></Head>
      <AuthLayout title="Create Your Account" subtitle="Join thousands on India's safest social companionship platform">
        {/* Role Toggle */}
        <div className="flex gap-2 p-1 glass rounded-xl mb-6">
          {[
            { val: 'user',      label: '👤 I'm a User',       desc: 'Book companions' },
            { val: 'companion', label: '⭐ I'm a Companion',   desc: 'Offer services' },
          ].map(r => (
            <button
              key={r.val}
              type="button"
              onClick={() => setRole(r.val)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 text-center ${
                role === r.val
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div>{r.label}</div>
              <div className="text-xs opacity-60">{r.desc}</div>
            </button>
          ))}
        </div>

        {role === 'companion' && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            ⚠️ Companion accounts require KYC (Aadhaar + selfie) verification before going live. Ensure you are 18+.
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full Name" icon={<RiUserLine />}>
            <input type="text" className="glass-input" placeholder="Your full name" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email Address" icon={<RiMailLine />}>
            <input type="email" className="glass-input" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Phone Number" icon={<RiPhoneLine />}>
            <input type="tel" className="glass-input" placeholder="10-digit mobile number" value={form.phone} onChange={set('phone')} maxLength={10} />
          </Field>
          <Field label="Password" icon={<RiLockPasswordLine />}>
            <div className="relative">
              <input type={show ? 'text' : 'password'} className="glass-input pr-10" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
              <button type="button" onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {show ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password" icon={<RiLockPasswordLine />}>
            <input type="password" className="glass-input" placeholder="Re-enter password" value={form.confirm} onChange={set('confirm')} />
          </Field>

          <p className="text-xs text-gray-600">
            By registering, you agree to our{' '}
            <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
            No adult services are permitted on this platform.
          </p>

          <button type="submit" disabled={busy} className="btn-primary w-full py-4 text-base disabled:opacity-60">
            {busy ? 'Creating account…' : `Create ${role === 'companion' ? 'Companion' : ''} Account`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </AuthLayout>
    </>
  );
}

// ── Shared Auth Layout ────────────────────────────────────────────────────────
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* BG orbs */}
      <div className="fixed top-1/3 left-1/4 w-72 h-72 bg-indigo-600/08 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-64 h-64 bg-violet-600/06 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">C</div>
          <span className="font-display font-bold text-2xl text-white">Companio</span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-1 text-center">{title}</h1>
          <p className="text-sm text-gray-500 text-center mb-6">{subtitle}</p>
          {children}
        </div>

        {/* Safety note */}
        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-gray-600">
          <RiShieldCheckLine className="text-emerald-700" />
          Safe & Secure · No Adult Services · KYC Protected
        </div>
      </motion.div>
    </div>
  );
}

// ── Shared Field ──────────────────────────────────────────────────────────────
export function Field({ label, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
        <span className="text-indigo-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
