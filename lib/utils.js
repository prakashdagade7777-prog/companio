// lib/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** ─── Surge Pricing ─────────────────────────────────── */
export function getSurgeMultiplier(date, startTime) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 6=Sat
  const hour = parseInt(startTime?.split(':')[0] ?? 14, 10);
  const isWeekend = day === 0 || day === 6;
  const isEvening = hour >= 18 && hour <= 23;
  const isPeakFriday = day === 5 && hour >= 17;

  if (isWeekend && isEvening) return 1.5;
  if (isWeekend) return 1.25;
  if (isEvening || isPeakFriday) return 1.15;
  return 1.0;
}

export function getSurgeLabel(multiplier) {
  if (multiplier >= 1.5)  return { label: '1.5× Surge', color: 'text-rose-400' };
  if (multiplier >= 1.25) return { label: '1.25× Surge', color: 'text-amber-400' };
  if (multiplier > 1)     return { label: '1.15× Surge', color: 'text-amber-300' };
  return { label: 'Standard Rate', color: 'text-emerald-400' };
}

export function calculateTotal(hourlyRate, hours, surgeMultiplier) {
  return Math.round(hourlyRate * hours * surgeMultiplier);
}

/** ─── Formatting ────────────────────────────────────── */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(ts) {
  if (!ts) return '–';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export function timeAgo(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return formatDate(d);
}

/** ─── Stars ─────────────────────────────────────────── */
export function renderStars(rating, size = 'sm') {
  const sz = size === 'sm' ? 'text-xs' : 'text-sm';
  return Array.from({ length: 5 }, (_, i) => ({
    filled: i < Math.round(rating),
    key: i,
  }));
}

/** ─── Avatar initials ───────────────────────────────── */
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/** ─── Chat ID ───────────────────────────────────────── */
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

/** ─── Booking status helpers ────────────────────────── */
export const STATUS_META = {
  pending_payment:      { label: 'Pending Payment',      cls: 'status-pending'  },
  pending_verification: { label: 'Under Verification',   cls: 'status-pending'  },
  confirmed:            { label: 'Confirmed',             cls: 'status-approved' },
  completed:            { label: 'Completed',             cls: 'status-approved' },
  cancelled:            { label: 'Cancelled',             cls: 'status-rejected' },
  disputed:             { label: 'Disputed',              cls: 'status-rejected' },
};

export const KYC_META = {
  pending:  { label: 'Pending Review', cls: 'status-pending'  },
  approved: { label: 'Approved',       cls: 'status-approved' },
  rejected: { label: 'Rejected',       cls: 'status-rejected' },
};

/** ─── Validation ────────────────────────────────────── */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export function validateAadhaar(num) {
  return /^\d{12}$/.test(num.replace(/\s/g, ''));
}

export function validateUTR(utr) {
  return utr.trim().length >= 12 && utr.trim().length <= 22;
}

/** ─── Random avatar placeholder ─────────────────────── */
export function avatarPlaceholder(gender = 'other', seed = '') {
  const styles = {
    female: 'adventurer',
    male:   'avataaars',
    other:  'bottts',
  };
  const style = styles[gender] ?? 'bottts';
  return `https://api.dicebear.com/8.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1e3f`;
}
