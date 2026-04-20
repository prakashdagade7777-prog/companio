// pages/auth/login.jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiShieldCheckLine } from 'react-icons/ri';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [show, setShow]   = useState(false);
  const [busy, setBusy]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push(router.query.next || '/dashboard');
    } catch (err) {
      toast.error(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head><title>Sign In – Companio</title></Head>
      <AuthLayout title="Welcome Back" subtitle="Sign in to your Companio account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email" icon={<RiMailLine />}>
            <input type="email" className="glass-input" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </Field>

          <Field label="Password" icon={<RiLockPasswordLine />}>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="glass-input pr-10"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {show ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          </Field>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one free</Link>
        </p>
      </AuthLayout>
    </>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────
// pages/auth/register.jsx  (combined in same file for brevity – split in prod)
export { default as RegisterPage } from './register';
