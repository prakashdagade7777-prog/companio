import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import TrustBanner, { TrustBadges } from '../components/TrustBanner';
import {
  RiShieldCheckLine,
  RiUserStarLine,
  RiCalendarCheckLine,
  RiMoneyDollarCircleLine,
  RiHeartLine,
  RiArrowRightLine,
  RiStarFill, // 
  RiVerifiedBadgeLine,
  RiMapPin2Line,
} from 'react-icons/ri';

const TESTIMONIALS = [
  { name: 'Arjun M.', city: 'Mumbai', rating: 5, text: 'Booked a companion for my corporate dinner. Professional and safe.' },
  { name: 'Priya S.', city: 'Bangalore', rating: 5, text: 'Amazing platform and great support.' },
  { name: 'Rohit K.', city: 'Delhi', rating: 5, text: 'Very smooth experience. Highly recommended.' },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Companio</title>
      </Head>

      <TrustBanner />

      {/* HERO */}
      <section className="text-center py-20">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl font-bold text-white"
        >
          Find Your Perfect Companion
        </motion.h1>

        <div className="mt-6 flex justify-center gap-4">
          <Link href="/companions" className="btn-primary">
            Browse <RiArrowRightLine />
          </Link>
        </div>

        <div className="mt-6">
          <TrustBadges />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="glass-card p-6">
              
              {/* ⭐ Stars */}
              <div className="flex mb-3">
                {Array.from({ length: t.rating }, (_, j) => (
                  <RiStarFill key={j} className="text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-400 mb-4">"{t.text}"</p>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-white">{t.name}</div>
                  <div className="text-gray-500 text-sm flex items-center gap-1">
                    <RiMapPin2Line /> {t.city}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>
    </>
  );
}