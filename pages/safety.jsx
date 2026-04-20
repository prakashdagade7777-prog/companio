// pages/safety.jsx
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrustBadges } from '../components/TrustBanner';
import {
  RiShieldCheckLine, RiFlag2Line, RiUserShieldLine,
  RiAlertLine, RiHeartLine, RiPhoneLine,
} from 'react-icons/ri';

const PILLARS = [
  {
    icon: <RiUserShieldLine />,
    title: 'Mandatory KYC for All Companions',
    desc: 'Every companion submits government-issued Aadhaar card + a live selfie. Our admin team manually reviews and approves each application. No companion goes live without identity verification.',
    color: 'emerald',
  },
  {
    icon: <RiShieldCheckLine />,
    title: 'Zero Tolerance Policy',
    desc: 'Companio operates a strict no-adult-services policy. Any attempt to solicit or provide adult services results in immediate and permanent banning of all parties involved — no second chances.',
    color: 'indigo',
  },
  {
    icon: <RiFlag2Line />,
    title: 'Report & Block System',
    desc: 'Any user can report any other user at any time. Reports are reviewed within 24 hours. Users can also instantly block companions. Our safety team investigates every report seriously.',
    color: 'rose',
  },
  {
    icon: <RiAlertLine />,
    title: '24/7 Safety Monitoring',
    desc: 'Our dedicated safety team monitors the platform around the clock. Automated systems flag suspicious activity. Emergency support is available for urgent safety situations.',
    color: 'amber',
  },
  {
    icon: <RiHeartLine />,
    title: 'Community Guidelines',
    desc: 'All users and companions must agree to our community guidelines before joining. These guidelines define acceptable behavior and set clear expectations for professional, respectful interactions.',
    color: 'violet',
  },
  {
    icon: <RiPhoneLine />,
    title: 'Emergency Contact',
    desc: 'If you ever feel unsafe during or after a booking, contact our emergency safety line immediately. We coordinate with local authorities when necessary to ensure your safety.',
    color: 'rose',
  },
];

const COLOR_MAP = {
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  indigo:  'text-indigo-400  bg-indigo-500/10  border-indigo-500/20',
  rose:    'text-rose-400    bg-rose-500/10    border-rose-500/20',
  amber:   'text-amber-400   bg-amber-500/10   border-amber-500/20',
  violet:  'text-violet-400  bg-violet-500/10  border-violet-500/20',
};

export default function SafetyPage() {
  return (
    <>
      <Head><title>Trust & Safety – Companio</title></Head>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="text-center mb-14">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <RiShieldCheckLine /> Your Safety is Our #1 Priority
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display font-bold text-5xl text-white mb-4">
            Trust & <span className="text-gradient">Safety</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto">
            Every feature of Companio is designed with your safety in mind. Here's how we protect you.
          </motion.p>
          <TrustBadges />
        </div>

        {/* Hero safety statement */}
        <div className="glass-card p-8 mb-12 text-center border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/05 to-transparent pointer-events-none" />
          <div className="text-5xl mb-3">🚫</div>
          <h2 className="font-display font-bold text-3xl text-white mb-3">No Adult Services. Ever.</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Companio is a professional social companionship platform. We facilitate connections for
            events, travel, dining, and social occasions only. Adult services of any kind are strictly
            forbidden and result in <strong className="text-white">immediate permanent banning</strong> of all parties.
          </p>
        </div>

        {/* Safety pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card p-5 flex gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border flex-shrink-0 ${COLOR_MAP[p.color]}`}>
                {p.icon}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1.5">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Report CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 text-center">
            <RiFlag2Line className="text-rose-400 text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Report an Issue</h3>
            <p className="text-sm text-gray-500 mb-4">Encountered something wrong? Report it immediately. We respond within 24 hours.</p>
            <Link href="/report" className="btn-primary block text-center">File a Report</Link>
          </div>
          <div className="glass-card p-6 text-center">
            <RiPhoneLine className="text-emerald-400 text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Emergency Safety Line</h3>
            <p className="text-sm text-gray-500 mb-4">For urgent safety situations during or after a booking. Available 24/7.</p>
            <a href="tel:+911800COMPANIO" className="btn-emerald block text-center">Call Safety Helpline</a>
          </div>
        </div>
      </div>
    </>
  );
}
