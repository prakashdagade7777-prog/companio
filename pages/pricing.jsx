// pages/pricing.jsx
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiCheckLine, RiCloseLine, RiCrownLine, RiShieldCheckLine } from 'react-icons/ri';

const USER_PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Get started and explore the platform.',
    color: 'gray',
    features: [
      { text: 'Browse all companion profiles', ok: true },
      { text: 'Up to 3 bookings/month',        ok: true },
      { text: 'Standard booking queue',         ok: true },
      { text: 'Basic chat',                     ok: true },
      { text: 'Priority booking',               ok: false },
      { text: 'Faster response guarantee',      ok: false },
      { text: 'Exclusive premium companions',   ok: false },
    ],
    cta: 'Get Started Free',
    href: '/auth/register',
  },
  {
    name: 'Premium',
    price: 499,
    period: 'month',
    description: 'Priority access to the best companions.',
    color: 'indigo',
    featured: true,
    features: [
      { text: 'Browse all companion profiles',  ok: true },
      { text: 'Unlimited bookings/month',       ok: true },
      { text: 'Priority booking queue',         ok: true },
      { text: 'Priority chat support',          ok: true },
      { text: '⚡ Priority booking',            ok: true },
      { text: 'Faster response guarantee',      ok: true },
      { text: 'Exclusive premium companions',   ok: true },
    ],
    cta: 'Upgrade to Premium',
    href: '/auth/register?plan=premium',
  },
];

const COMPANION_PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Start earning on Companio.',
    color: 'gray',
    features: [
      { text: 'Profile listing',                ok: true },
      { text: 'Up to 5 active bookings/month',  ok: true },
      { text: 'Basic analytics',                ok: true },
      { text: 'Standard support',               ok: true },
      { text: 'Featured profile listing',        ok: false },
      { text: 'Unlimited bookings',             ok: false },
      { text: 'Priority search placement',      ok: false },
      { text: '💎 Premium companion badge',     ok: false },
    ],
    cta: 'Join as Companion',
    href: '/auth/register?role=companion',
  },
  {
    name: 'Premium',
    price: 999,
    period: 'month',
    description: 'Maximize your bookings and earnings.',
    color: 'indigo',
    featured: true,
    features: [
      { text: 'Profile listing',                ok: true },
      { text: 'Unlimited active bookings',      ok: true },
      { text: 'Advanced analytics dashboard',   ok: true },
      { text: 'Priority support',               ok: true },
      { text: '⭐ Featured profile listing',     ok: true },
      { text: 'Unlimited bookings',             ok: true },
      { text: 'Priority search placement',      ok: true },
      { text: '💎 Premium companion badge',     ok: true },
    ],
    cta: 'Go Premium',
    href: '/auth/register?role=companion&plan=premium',
  },
];

const FADE_UP = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.1 },
});

export default function PricingPage() {
  return (
    <>
      <Head><title>Pricing – Companio</title></Head>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <motion.div {...FADE_UP(0)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
            <RiCrownLine /> Simple, Transparent Pricing
          </motion.div>
          <motion.h1 {...FADE_UP(1)} className="font-display font-bold text-5xl text-white mb-4">
            Choose Your <span className="text-gradient">Plan</span>
          </motion.h1>
          <motion.p {...FADE_UP(2)} className="text-gray-500 text-lg">
            Whether you're booking or providing companionship, we have a plan for you.
          </motion.p>
        </div>

        {/* ── User Plans ── */}
        <motion.h2 {...FADE_UP(3)} className="font-display font-semibold text-2xl text-white mb-6 text-center">
          For Users (Booking Companions)
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {USER_PLANS.map((plan, i) => <PlanCard key={plan.name} plan={plan} index={i} />)}
        </div>

        {/* ── Companion Plans ── */}
        <motion.h2 {...FADE_UP(3)} className="font-display font-semibold text-2xl text-white mb-6 text-center">
          For Companion Providers
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {COMPANION_PLANS.map((plan, i) => <PlanCard key={plan.name + 'c'} plan={plan} index={i} />)}
        </div>

        {/* Featured Boost add-on */}
        <div className="max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 text-center border border-indigo-500/20"
          >
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-display font-bold text-xl text-white mb-2">Featured Profile Boost</h3>
            <p className="text-gray-500 text-sm mb-4">
              Get your profile pinned at the top of all search results for maximum visibility.
              Available for companion providers separately.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { dur: '7 days',  price: '₹499'  },
                { dur: '30 days', price: '₹1,499' },
                { dur: '90 days', price: '₹3,999' },
              ].map(b => (
                <div key={b.dur} className="glass p-3 rounded-xl text-center">
                  <div className="text-white font-bold">{b.price}</div>
                  <div className="text-xs text-gray-500">{b.dur}</div>
                </div>
              ))}
            </div>
            <Link href="/auth/register?role=companion" className="btn-primary">Get Featured →</Link>
          </motion.div>
        </div>

        {/* Trust */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-emerald-600">
            <RiShieldCheckLine />
            All plans include: KYC verification · 24/7 safety monitoring · No adult services
          </div>
        </div>
      </div>
    </>
  );
}

function PlanCard({ plan, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`glass-card p-6 relative overflow-hidden ${plan.featured ? 'border-indigo-500/30' : ''}`}
    >
      {plan.featured && (
        <>
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-bl-xl">
            MOST POPULAR
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/05 to-violet-600/05 pointer-events-none" />
        </>
      )}

      <div className="mb-5">
        <div className={`text-sm font-semibold mb-1 ${plan.featured ? 'text-indigo-400' : 'text-gray-400'}`}>{plan.name}</div>
        <div className="flex items-end gap-1 mb-1">
          <span className="font-display font-bold text-4xl text-white">
            {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
          </span>
          {plan.price > 0 && <span className="text-gray-500 text-sm mb-1">/{plan.period}</span>}
        </div>
        <p className="text-sm text-gray-500">{plan.description}</p>
      </div>

      <div className="space-y-2.5 mb-6">
        {plan.features.map((f) => (
          <div key={f.text} className={`flex items-center gap-2.5 text-sm ${f.ok ? 'text-gray-300' : 'text-gray-600'}`}>
            {f.ok
              ? <RiCheckLine className="text-emerald-400 text-base shrink-0" />
              : <RiCloseLine className="text-gray-700 text-base shrink-0" />}
            {f.text}
          </div>
        ))}
      </div>

      <Link href={plan.href} className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
        plan.featured ? 'btn-primary' : 'btn-ghost'
      }`}>
        {plan.cta}
      </Link>
    </motion.div>
  );
}
