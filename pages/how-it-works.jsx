// pages/how-it-works.jsx
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrustBadges } from '../components/TrustBanner';
import {
  RiSearchLine, RiCalendarLine, RiBankCardLine, RiHeartLine,
  RiShieldCheckLine, RiUserStarLine, RiIdCardLine, RiStarLine,
} from 'react-icons/ri';

const BOOKING_STEPS = [
  { icon: <RiSearchLine />, title: 'Browse & Discover', desc: 'Explore our curated marketplace of verified companions. Filter by city, gender, interests, languages, and price range. View detailed profiles, photos, reviews, and availability.', color: 'indigo' },
  { icon: <RiCalendarLine />, title: 'Book a Session', desc: 'Choose your date, time, duration (1-8 hours), occasion type, and meeting location. Our surge pricing system shows transparent pricing upfront — no hidden charges.', color: 'violet' },
  { icon: <RiBankCardLine />, title: 'Pay via UTR / UPI', desc: 'Transfer the booking amount via UPI, NEFT, or IMPS to our secure account. Upload your UTR number and payment screenshot. Our admin team verifies within 2-4 hours.', color: 'amber' },
  { icon: <RiHeartLine />, title: 'Meet & Enjoy', desc: 'Once payment is verified, your booking is confirmed and you\'ll receive the companion\'s contact details. Enjoy a safe, professional, and memorable social experience!', color: 'emerald' },
];

const PROVIDER_STEPS = [
  { icon: <RiUserStarLine />, title: 'Create Your Profile', desc: 'Sign up as a companion, add your photos, bio, interests, languages, availability, and set your hourly rate. Make your profile shine!', color: 'indigo' },
  { icon: <RiIdCardLine />, title: 'Complete KYC Verification', desc: 'Submit your Aadhaar card (front + back) and a live selfie. Our admin team reviews and approves within 24 hours. Your profile goes live only after approval.', color: 'amber' },
  { icon: <RiCalendarLine />, title: 'Accept Bookings', desc: 'Users book you through the platform. You\'ll receive notifications for new bookings. Manage your schedule and availability through your dashboard.', color: 'violet' },
  { icon: <RiStarLine />, title: 'Earn & Get Reviewed', desc: 'Complete sessions professionally and earn income. Users leave ratings and reviews that build your reputation. Weekly payouts every Monday via bank transfer.', color: 'emerald' },
];

const FAQS = [
  { q: 'Is Companio safe?', a: 'Yes. All companions undergo mandatory KYC verification (Aadhaar + selfie). Our 24/7 safety team monitors all activity. We have a strict zero-tolerance policy for adult services and misconduct.' },
  { q: 'What types of companionship are available?', a: 'Companio facilitates safe, professional social companionship only — for corporate events, weddings, travel, dinners, movies, shopping, birthday parties, and similar social occasions.' },
  { q: 'Is this a dating or escort platform?', a: 'Absolutely not. Companio is a strictly professional social companionship platform. Any attempt to arrange adult services results in immediate permanent banning of both parties.' },
  { q: 'How does payment verification work?', a: 'After booking, users transfer payment via UPI/bank and submit their UTR + screenshot. Our admin team verifies the transaction and confirms the booking within 2-4 hours.' },
  { q: 'What if I have a problem during a session?', a: 'Contact our 24/7 safety team immediately. You can also file a report directly on our platform. We take all safety concerns extremely seriously and respond within 1 hour.' },
  { q: 'Can companions set their own rates?', a: 'Yes. Companions set their own hourly rates. Our platform applies a 15% commission. Weekend and evening bookings may have surge multipliers (clearly shown before booking).' },
];

export default function HowItWorksPage() {
  return (
    <>
      <Head><title>How Companio Works – Safe Social Companionship</title></Head>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="text-center mb-14">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display font-bold text-5xl text-white mb-4">
            How <span className="text-gradient">Companio</span> Works
          </motion.h1>
          <p className="text-gray-500 text-lg mb-8">Transparent, safe, and simple — from browse to booking in minutes.</p>
          <TrustBadges />
        </div>

        {/* For Users */}
        <div className="mb-20">
          <h2 className="font-display font-bold text-3xl text-white text-center mb-10">
            📱 For Users — Booking a Companion
          </h2>
          <div className="space-y-4">
            {BOOKING_STEPS.map((s, i) => {
              const colorMap = { indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-5 flex gap-5"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border flex-shrink-0 ${colorMap[s.color]}`}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-600">Step {i + 1}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* For Companions */}
        <div className="mb-20">
          <h2 className="font-display font-bold text-3xl text-white text-center mb-10">
            ⭐ For Companions — Start Earning
          </h2>
          <div className="space-y-4">
            {PROVIDER_STEPS.map((s, i) => {
              const colorMap = { indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-5 flex gap-5"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border flex-shrink-0 ${colorMap[s.color]}`}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-xs font-mono text-gray-600 mb-1">Step {i + 1}</div>
                    <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="font-display font-bold text-3xl text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-card p-5"
              >
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center glass-card p-10">
          <h2 className="font-display font-bold text-3xl text-white mb-3">Ready to Get Started?</h2>
          <p className="text-gray-500 mb-6">Join thousands enjoying safe social companionship across India.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/companions" className="btn-primary px-8 py-4">Browse Companions</Link>
            <Link href="/auth/register?role=companion" className="btn-ghost px-8 py-4">Become a Companion</Link>
          </div>
        </div>
      </div>
    </>
  );
}
