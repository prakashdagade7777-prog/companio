// pages/companions/[id].jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { MdVerified } from 'react-icons/md';
import {
  RiMapPin2Line, RiStarFillLine, RiTimeLine, RiCalendarLine,
  RiShieldCheckLine, RiHeartLine, RiShareLine, RiFlag2Line,
  RiLanguageLine, RiUserLine, RiArrowLeftLine,
} from 'react-icons/ri';
import { formatCurrency, getSurgeMultiplier, getSurgeLabel, calculateTotal, avatarPlaceholder } from '../../lib/utils';

// Mock companion data – in production, fetch from Firestore by id
function getMockCompanion(id) {
  return {
    uid: id,
    displayName: 'Priya Sharma',
    gender: 'female',
    age: 24,
    city: 'Mumbai',
    bio: "Hi! I'm Priya, a vibrant, articulate, and friendly companion based in Mumbai. I hold a Masters degree in Mass Communication and I'm passionate about travel, photography, literature, and fine dining. I speak English, Hindi, and Marathi fluently. I love meeting new people and creating memorable experiences. Whether it's a corporate dinner, a social event, a travel companion, or just good company for the evening, I'm your person! I believe in meaningful conversations and genuine connections.",
    photos: [],
    languages: ['English', 'Hindi', 'Marathi'],
    interests: ['Travel', 'Photography', 'Fine Dining', 'Literature', 'Art Galleries', 'Music', 'Fitness'],
    hourlyRate: 800,
    rating: 4.8,
    reviewCount: 47,
    isVerified: true,
    isFeatured: true,
    plan: 'premium',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    availableHours: { start: '10:00', end: '22:00' },
    reviews: [
      { name: 'Rahul M.', rating: 5, date: '2 days ago', text: 'Priya was absolutely wonderful at my product launch event. Professional, engaging, and made everyone comfortable. Highly recommended!' },
      { name: 'Vikram S.', rating: 5, date: '1 week ago', text: 'Booked for a family wedding. She blended in perfectly and was charming throughout. Will definitely book again.' },
      { name: 'Amit K.', rating: 4, date: '2 weeks ago', text: 'Great companion for a business dinner. Well-spoken and culturally aware. A genuine professional.' },
    ],
  };
}

export default function CompanionProfile() {
  const router    = useRouter();
  const { id }    = router.query;
  const companion = getMockCompanion(id);
  const [tab,     setTab]     = useState('about');
  const [imgIdx,  setImgIdx]  = useState(0);

  const avatar  = avatarPlaceholder(companion.gender, id || 'demo');
  const photos  = [avatar, avatar, avatar]; // In prod: companion.photos
  const surge   = getSurgeMultiplier(new Date().toISOString(), '18:00');
  const surgeInfo = getSurgeLabel(surge);

  return (
    <>
      <Head>
        <title>{companion.displayName} – Companio</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link href="/companions" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <RiArrowLeftLine /> Back to Companions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Photos + Quick Info ── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Main photo */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
              <img src={photos[imgIdx]} alt={companion.displayName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {companion.isFeatured && <span className="badge-featured">⭐ Featured</span>}
                {companion.isVerified && <span className="badge-verified"><MdVerified />Verified</span>}
              </div>

              {/* Rate */}
              <div className="absolute bottom-4 right-4">
                <div className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm">
                  <span className="text-white font-bold">{formatCurrency(companion.hourlyRate)}</span>
                  <span className="text-gray-300 text-xs">/hr</span>
                </div>
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`flex-1 rounded-xl overflow-hidden aspect-square border-2 transition-all ${i === imgIdx ? 'border-indigo-500' : 'border-transparent'}`}>
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Trust Box */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-3">
                <RiShieldCheckLine className="text-base" />
                Safety Guarantee
              </div>
              <div className="space-y-2 text-xs text-gray-500">
                <p>✓ KYC identity verified by Companio</p>
                <p>✓ Background check completed</p>
                <p>✓ Community guidelines signed</p>
                <p>✓ 24/7 safety monitoring active</p>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-emerald-600 font-semibold">
                🚫 No Adult Services – Ever
              </div>
            </div>
          </div>

          {/* ── Right: Details ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-bold text-3xl text-white mb-1">
                    {companion.displayName}
                    {companion.isVerified && <MdVerified className="inline ml-2 text-emerald-400 text-2xl" />}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><RiMapPin2Line className="text-indigo-400" />{companion.city}</span>
                    <span>{companion.age} years</span>
                    <span className="capitalize">{companion.gender}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white transition-colors"><RiHeartLine /></button>
                  <button className="w-9 h-9 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white transition-colors"><RiShareLine /></button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <RiStarFillLine key={i} className={i < Math.round(companion.rating) ? 'text-amber-400' : 'text-gray-700'} />
                  ))}
                </div>
                <span className="text-white font-semibold">{companion.rating}</span>
                <span className="text-gray-500 text-sm">({companion.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 glass rounded-xl">
              {['about', 'reviews', 'availability'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                    tab === t ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {tab === 'about' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-white mb-3">About</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{companion.bio}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {companion.languages.map(l => (
                        <span key={l} className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">{l}</span>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {companion.interests.map(i => (
                        <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">{i}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {companion.reviews.map((r, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                          {r.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{r.name}</div>
                          <div className="text-xs text-gray-500">{r.date}</div>
                        </div>
                      </div>
                      <div className="flex">
                        {Array.from({ length: r.rating }, (_, j) => <RiStarFillLine key={j} className="text-amber-400 text-xs" />)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{r.text}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {tab === 'availability' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
                <h3 className="font-semibold text-white mb-4">Available Days</h3>
                <div className="flex flex-wrap gap-2 mb-5">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <span key={d} className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      companion.availableDays.some(a => a.startsWith(d.slice(0,3)))
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/3 text-gray-600 border border-white/5'
                    }`}>{d}</span>
                  ))}
                </div>
                <h4 className="font-medium text-white mb-2">Hours</h4>
                <p className="text-sm text-gray-400">{companion.availableHours.start} – {companion.availableHours.end}</p>
              </motion.div>
            )}

            {/* ── Booking Card ── */}
            <div className="glass-card p-6 border border-indigo-500/20">
              <h3 className="font-semibold text-white mb-4">Book {companion.displayName.split(' ')[0]}</h3>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-gray-400">Base Rate</span>
                <span className="text-white font-semibold">{formatCurrency(companion.hourlyRate)}/hr</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-gray-400">Current Surge</span>
                <span className={`text-sm font-semibold ${surgeInfo.color}`}>{surgeInfo.label}</span>
              </div>
              <div className="flex items-center justify-between py-3 mb-4">
                <span className="text-sm text-gray-400">Est. 3hr booking</span>
                <span className="text-white font-bold text-lg">{formatCurrency(calculateTotal(companion.hourlyRate, 3, surge))}</span>
              </div>

              <Link href={`/booking/${id}`} className="btn-primary w-full text-center block text-base py-4">
                Book Now →
              </Link>

              <button
                onClick={() => {}}
                className="w-full mt-2 flex items-center gap-2 justify-center py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs transition-colors"
              >
                <RiFlag2Line /> Report this profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
