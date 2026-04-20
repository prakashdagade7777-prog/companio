// pages/companions/index.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import CompanionCard, { CompanionCardSkeleton } from '../../components/CompanionCard';
import TrustBanner from '../../components/TrustBanner';
import { RiSearchLine, RiFilterLine, RiMapPin2Line, RiSortAsc } from 'react-icons/ri';
import { motion } from 'framer-motion';

const CITIES     = ['All Cities','Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Pune','Kolkata','Jaipur','Ahmedabad','Surat'];
const GENDERS    = ['All', 'Female', 'Male', 'Other'];
const SORT_BY    = ['Rating', 'Price: Low to High', 'Price: High to Low', 'Newest'];
const PRICE_RANGES = [
  { label: 'Any Price',      min: 0,    max: Infinity },
  { label: 'Under ₹500/hr',  min: 0,    max: 500 },
  { label: '₹500–₹1000/hr', min: 500,  max: 1000 },
  { label: '₹1000–₹2000/hr',min: 1000, max: 2000 },
  { label: '₹2000+/hr',     min: 2000, max: Infinity },
];

// ── Mock data for preview (replace with Firestore in prod) ──
const MOCK_COMPANIONS = Array.from({ length: 12 }, (_, i) => ({
  uid:          `companion_${i}`,
  displayName:  ['Priya Sharma', 'Ananya Singh', 'Riya Patel', 'Meera Iyer',
                 'Arjun Mehta', 'Rohan Das', 'Karan Joshi', 'Dev Nair',
                 'Simran Kaur', 'Tara Reddy', 'Siya Gupta', 'Nisha Roy'][i],
  gender:       i < 4 ? 'female' : i < 8 ? 'male' : 'other',
  age:          22 + (i % 8),
  city:         CITIES[1 + (i % 9)],
  bio:          'Friendly, professional companion for social events, travel, and meaningful conversations.',
  photos:       [],
  hourlyRate:   400 + i * 100,
  rating:       3.5 + (i % 3) * 0.5,
  reviewCount:  10 + i * 5,
  isVerified:   i % 3 !== 0,
  isFeatured:   i < 3,
  plan:         i < 5 ? 'premium' : 'free',
  interests:    ['Travel', 'Music', 'Dining', 'Movies', 'Art', 'Fitness'].slice(0, 2 + (i % 4)),
  languages:    ['English', 'Hindi'],
}));

export default function CompanionsPage() {
  const [companions,   setCompanions]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [city,         setCity]         = useState('All Cities');
  const [gender,       setGender]       = useState('All');
  const [priceRange,   setPriceRange]   = useState(0);
  const [sortBy,       setSortBy]       = useState('Rating');
  const [showFilters,  setShowFilters]  = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    // In production: query Firestore
    // For now, use mock data
    setTimeout(() => {
      setCompanions(MOCK_COMPANIONS);
      setLoading(false);
    }, 800);
  }, []);

  // ── Client-side filtering ──
  const filtered = companions.filter(c => {
    const pr = PRICE_RANGES[priceRange];
    if (search && !c.displayName.toLowerCase().includes(search.toLowerCase()) &&
        !c.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (city !== 'All Cities' && c.city !== city) return false;
    if (gender !== 'All' && c.gender.toLowerCase() !== gender.toLowerCase()) return false;
    if (c.hourlyRate < pr.min || c.hourlyRate > pr.max) return false;
    if (verifiedOnly && !c.isVerified) return false;
    if (featuredOnly && !c.isFeatured) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Rating')                return b.rating - a.rating;
    if (sortBy === 'Price: Low to High')    return a.hourlyRate - b.hourlyRate;
    if (sortBy === 'Price: High to Low')    return b.hourlyRate - a.hourlyRate;
    return 0;
  });

  // Featured first
  const sorted = [
    ...filtered.filter(c => c.isFeatured),
    ...filtered.filter(c => !c.isFeatured),
  ];

  return (
    <>
      <Head>
        <title>Browse Companions – Companio</title>
      </Head>

      <TrustBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-4xl text-white mb-2">
            Browse <span className="text-gradient">Verified Companions</span>
          </h1>
          <p className="text-gray-500">All companions are KYC-verified. Safe, professional, and trusted.</p>
        </div>

        {/* ── Search + Filter Bar ── */}
        <div className="glass-card p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                className="glass-input pl-10"
                placeholder="Search by name or city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* City */}
            <select
              className="glass-input md:w-48"
              value={city}
              onChange={e => setCity(e.target.value)}
            >
              {CITIES.map(c => <option key={c} value={c} className="bg-brand-card">{c}</option>)}
            </select>

            {/* Gender */}
            <select
              className="glass-input md:w-36"
              value={gender}
              onChange={e => setGender(e.target.value)}
            >
              {GENDERS.map(g => <option key={g} value={g} className="bg-brand-card">{g}</option>)}
            </select>

            {/* Sort */}
            <select
              className="glass-input md:w-48"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_BY.map(s => <option key={s} value={s} className="bg-brand-card">{s}</option>)}
            </select>

            {/* More Filters */}
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`btn-ghost flex items-center gap-2 md:w-auto ${showFilters ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : ''}`}
            >
              <RiFilterLine /> Filters
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4"
            >
              {/* Price Range */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Price Range</label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((pr, i) => (
                    <button
                      key={pr.label}
                      onClick={() => setPriceRange(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        priceRange === i
                          ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                          : 'glass text-gray-400 hover:text-white'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setVerifiedOnly(p => !p)}
                    className={`w-10 h-5 rounded-full transition-colors ${verifiedOnly ? 'bg-emerald-500' : 'bg-gray-700'} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${verifiedOnly ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-400">Verified Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setFeaturedOnly(p => !p)}
                    className={`w-10 h-5 rounded-full transition-colors ${featuredOnly ? 'bg-indigo-500' : 'bg-gray-700'} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${featuredOnly ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-400">Featured Only</span>
                </label>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Results count ── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${sorted.length} companion${sorted.length !== 1 ? 's' : ''} found`}
          </p>
          {featuredOnly || verifiedOnly || city !== 'All Cities' || gender !== 'All' || priceRange !== 0 ? (
            <button
              onClick={() => { setFeaturedOnly(false); setVerifiedOnly(false); setCity('All Cities'); setGender('All'); setPriceRange(0); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Clear filters ×
            </button>
          ) : null}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="companion-grid">
            {Array.from({ length: 8 }, (_, i) => <CompanionCardSkeleton key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No companions found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="companion-grid">
            {sorted.map((companion, i) => (
              <CompanionCard key={companion.uid} companion={companion} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
