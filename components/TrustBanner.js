// components/TrustBanner.jsx
"use client";
import { motion } from 'framer-motion';
import { RiShieldCheckLine, RiHeartLine, RiVerifiedBadgeLine } from 'react-icons/ri';

const ITEMS = [
  { icon: <RiShieldCheckLine />,     label: '🚫 No Adult Services – Ever' },
  { icon: <RiVerifiedBadgeLine />,   label: 'KYC Verified Companions Only' },
  { icon: <RiHeartLine />,           label: 'Safe Social Companionship Only' },
  { icon: <RiShieldCheckLine />,     label: '24/7 Safety Monitoring' },
];

export default function TrustBanner({ className = '' }) {
  return (
    <div className={`trust-strip py-2.5 overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-12 items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-emerald-400 shrink-0">
            <span className="text-base">{item.icon}</span>
            {item.label}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 ml-4" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/** Static variant for pages that don't need the marquee */
export function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {[
        { icon: '🚫', text: 'No Adult Services' },
        { icon: '✅', text: 'KYC Verified' },
        { icon: '🛡️', text: 'Safe & Monitored' },
        { icon: '⭐', text: 'Rated & Reviewed' },
      ].map((b) => (
        <span key={b.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          {b.icon} {b.text}
        </span>
      ))}
    </div>
  );
}
