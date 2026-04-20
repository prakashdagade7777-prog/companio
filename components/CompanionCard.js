// components/CompanionCard.jsx
"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiMapPin2Line, RiStarFillLine, RiTimeLine, RiVerifiedBadgeLine } from 'react-icons/ri';
import { MdVerified } from 'react-icons/md';
import { formatCurrency, getInitials, avatarPlaceholder } from '../lib/utils';

export default function CompanionCard({ companion, index = 0 }) {
  const {
    uid, displayName, gender, age, city,
    bio, photos, hourlyRate, rating, reviewCount,
    isVerified, isFeatured, plan,
    interests = [], languages = [],
  } = companion;

  const avatar = photos?.[0] || avatarPlaceholder(gender, uid);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link href={`/companions/${uid}`} className="block group">
        <div className="glass-card overflow-hidden cursor-pointer">

          {/* ── Photo ── */}
          <div className="relative h-60 overflow-hidden">
            <img
              src={avatar}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {isFeatured && (
                <span className="badge-featured">⭐ Featured</span>
              )}
              {plan === 'premium' && !isFeatured && (
                <span className="badge-premium">💎 Premium</span>
              )}
            </div>

            {isVerified && (
              <div className="absolute top-3 right-3">
                <span className="badge-verified">
                  <MdVerified className="text-emerald-400" />
                  Verified
                </span>
              </div>
            )}

            {/* Rate pill at bottom */}
            <div className="absolute bottom-3 right-3">
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                {formatCurrency(hourlyRate)}/hr
              </span>
            </div>
          </div>

          {/* ── Info ── */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-display font-semibold text-base text-white group-hover:text-indigo-300 transition-colors truncate">
                {displayName}
                {isVerified && <MdVerified className="inline ml-1.5 text-emerald-400 text-sm" />}
              </h3>
              <span className="text-xs text-gray-500 ml-2 shrink-0">{age}y</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
              <RiMapPin2Line className="text-indigo-400 shrink-0" />
              <span className="truncate">{city || 'India'}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <RiStarFillLine
                    key={i}
                    className={i < Math.round(rating) ? 'text-amber-400 text-xs' : 'text-gray-700 text-xs'}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {rating > 0 ? rating.toFixed(1) : 'New'} {reviewCount > 0 && `(${reviewCount})`}
              </span>
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{bio}</p>
            )}

            {/* Interests chips */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {interests.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 text-[10px] font-medium">
                    {tag}
                  </span>
                ))}
                {interests.length > 3 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500 text-[10px]">
                    +{interests.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Book CTA */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className="block w-full text-center py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all duration-200">
                View Profile & Book →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** Skeleton loader card */
export function CompanionCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="h-60 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
        <div className="h-8 bg-white/5 rounded mt-4" />
      </div>
    </div>
  );
}
