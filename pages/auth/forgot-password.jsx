// pages/auth/forgot-password.jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout, Field } from './register';
import toast from 'react-hot-toast';
import { RiMailLine, RiArrowLeftLine, RiCheckboxCircleLine } from 'react-icons/ri';
import { validateEmail } from '../../lib/utils';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail]   = useState('');
  const [busy,  setBusy]    = useState(false);
  const [sent,  setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) return toast.error('Enter a valid email address');
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      toast.error('Could not send reset email. Please check the address.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head><title>Reset Password – Companio</title></Head>
      <AuthLayout title="Reset Password" subtitle="We'll send a reset link to your email.">
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <RiCheckboxCircleLine className="text-emerald-400 text-3xl" />
            </div>
            <h3 className="font-semibold text-white mb-2">Check Your Inbox</h3>
            <p className="text-sm text-gray-500 mb-5">
              We've sent a password reset link to <strong className="text-white">{email}</strong>.<br />
              Check your spam folder if you don't see it.
            </p>
            <Link href="/auth/login" className="btn-primary block w-full text-center py-3">Back to Sign In</Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email Address" icon={<RiMailLine />}>
              <input
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </Field>
            <button type="submit" disabled={busy || !email} className="btn-primary w-full py-4 text-base disabled:opacity-50">
              {busy ? 'Sending…' : 'Send Reset Link'}
            </button>
            <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mt-2">
              <RiArrowLeftLine /> Back to Sign In
            </Link>
          </form>
        )}
      </AuthLayout>
    </>
  );
}
