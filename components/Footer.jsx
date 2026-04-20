// components/Footer.jsx
import Link from 'next/link';
import { RiShieldCheckLine, RiInstagramLine, RiTwitterXLine, RiLinkedinBoxLine } from 'react-icons/ri';

const LINKS = {
  Company:   [['About', '/about'], ['Careers', '/careers'], ['Blog', '/blog'], ['Press', '/press']],
  Platform:  [['Browse Companions', '/companions'], ['Become a Companion', '/auth/register?role=companion'], ['How It Works', '/how-it-works'], ['Pricing', '/pricing']],
  Safety:    [['Trust & Safety', '/safety'], ['Report Abuse', '/report'], ['Community Guidelines', '/guidelines'], ['KYC Policy', '/kyc-policy']],
  Support:   [['Help Center', '/help'], ['Contact Us', '/contact'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">C</div>
              <span className="font-display font-bold text-lg text-white">Companio</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Safe, verified social companionship for meaningful experiences. No adult services. Ever.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
              <RiShieldCheckLine className="text-base" />
              Safe Social Companionship Only
            </div>
            <div className="flex gap-3 mt-5">
              {[[RiInstagramLine, '#'], [RiTwitterXLine, '#'], [RiLinkedinBoxLine, '#']].map(([Icon, href], i) => (
                <a key={i} href={href} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white hover:border-indigo-500/30 transition-all duration-200">
                  <Icon className="text-base" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Companio Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">🇮🇳 Made in India</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="text-xs font-semibold text-emerald-600">🚫 No Adult Services</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
