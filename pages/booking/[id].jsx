// pages/booking/[id].jsx
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getSurgeMultiplier, getSurgeLabel, calculateTotal, formatCurrency, avatarPlaceholder } from '../../lib/utils';
import toast from 'react-hot-toast';
import { v4 as uuid } from 'uuid';
import {
  RiCalendarLine, RiTimeLine, RiMapPin2Line, RiHeartLine,
  RiArrowRightLine, RiArrowLeftLine, RiShieldCheckLine,
} from 'react-icons/ri';

const OCCASIONS  = ['Corporate Event', 'Wedding / Family Gathering', 'Dinner Date', 'Travel Companion', 'Birthday Party', 'Movie / Theatre', 'Shopping', 'Other'];
const HOURS_OPTS = [1, 2, 3, 4, 5, 6, 8];

export default function BookingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  // Mock companion for demo
  const companion = {
    uid: id, displayName: 'Priya Sharma', gender: 'female',
    hourlyRate: 800, isVerified: true,
  };

  const [step,  setStep]  = useState(1); // 1: details, 2: confirm
  const [busy,  setBusy]  = useState(false);
  const [form,  setForm]  = useState({
    date: '', startTime: '', hours: 2, location: '', occasion: '', notes: '',
  });

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const surge      = form.date && form.startTime ? getSurgeMultiplier(form.date, form.startTime) : 1;
  const surgeInfo  = getSurgeLabel(surge);
  const total      = calculateTotal(companion.hourlyRate, form.hours, surge);
  const avatar     = avatarPlaceholder(companion.gender, id || 'x');

  const isStep1Valid = form.date && form.startTime && form.location && form.occasion;

  const handleConfirm = async () => {
    if (!user) return router.push('/auth/login?next=' + encodeURIComponent(router.asPath));
    setBusy(true);
    try {
      const bookingId = uuid();
      await addDoc(collection(db, 'bookings'), {
        bookingId,
        userId:      user.uid,
        companionId: id,
        userSnapshot:      { name: profile?.name || 'User', avatar: profile?.avatar || '' },
        companionSnapshot: { displayName: companion.displayName, avatar: '' },
        date:        form.date,
        startTime:   form.startTime,
        hours:       form.hours,
        location:    form.location,
        occasion:    form.occasion,
        notes:       form.notes,
        baseRate:    companion.hourlyRate,
        surgeMultiplier: surge,
        totalAmount: total,
        status:      'pending_payment',
        paymentId:   null,
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      });
      toast.success('Booking created! Please complete payment.');
      router.push(`/payment/upload?booking=${bookingId}&amount=${total}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head><title>Book {companion.displayName} – Companio</title></Head>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href={`/companions/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <RiArrowLeftLine /> Back to Profile
        </Link>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          {['Booking Details', 'Confirm & Pay'].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > i + 1 ? 'bg-emerald-500 text-white' :
                  step === i + 1 ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-500'
                }`}>{i + 1}</div>
                <span className={`text-sm font-medium ${step === i + 1 ? 'text-white' : 'text-gray-500'}`}>{s}</span>
              </div>
              {i < 1 && <div className="h-px w-8 bg-white/10 flex-1" />}
            </div>
          ))}
        </div>

        <div className="glass-card p-6">
          {/* Companion summary */}
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-white/5">
            <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="font-semibold text-white">{companion.displayName}</div>
              <div className="text-xs text-gray-500">{formatCurrency(companion.hourlyRate)}/hr · {companion.isVerified ? '✅ Verified' : ''}</div>
            </div>
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Date */}
              <FormField label="Date" icon={<RiCalendarLine />}>
                <input
                  type="date"
                  className="glass-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.date}
                  onChange={e => set('date')(e.target.value)}
                />
              </FormField>

              {/* Time */}
              <FormField label="Start Time" icon={<RiTimeLine />}>
                <input type="time" className="glass-input" value={form.startTime} onChange={e => set('startTime')(e.target.value)} />
              </FormField>

              {/* Hours */}
              <FormField label="Duration">
                <div className="flex flex-wrap gap-2">
                  {HOURS_OPTS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => set('hours')(h)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        form.hours === h ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'glass text-gray-400 hover:text-white'
                      }`}
                    >
                      {h}hr
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Occasion */}
              <FormField label="Occasion" icon={<RiHeartLine />}>
                <select className="glass-input" value={form.occasion} onChange={e => set('occasion')(e.target.value)}>
                  <option value="">Select occasion…</option>
                  {OCCASIONS.map(o => <option key={o} value={o} className="bg-brand-card">{o}</option>)}
                </select>
              </FormField>

              {/* Location */}
              <FormField label="Meeting Location / Area" icon={<RiMapPin2Line />}>
                <input type="text" className="glass-input" placeholder="e.g. Bandra, Mumbai or specific venue" value={form.location} onChange={e => set('location')(e.target.value)} />
              </FormField>

              {/* Notes */}
              <FormField label="Additional Notes (optional)">
                <textarea className="glass-input resize-none" rows={3} placeholder="Any special requests or information…" value={form.notes} onChange={e => set('notes')(e.target.value)} />
              </FormField>

              {/* Pricing summary */}
              {form.date && form.startTime && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">{formatCurrency(companion.hourlyRate)} × {form.hours}hr</span>
                    <span className="text-white">{formatCurrency(companion.hourlyRate * form.hours)}</span>
                  </div>
                  {surge > 1 && (
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className={surgeInfo.color}>{surgeInfo.label}</span>
                      <span className={surgeInfo.color}>×{surge}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold border-t border-white/10 pt-2 mt-2">
                    <span className="text-white">Total</span>
                    <span className="text-gradient text-lg">{formatCurrency(total)}</span>
                  </div>
                </motion.div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="btn-primary w-full py-4 text-base disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Continue to Confirm <RiArrowRightLine />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="font-semibold text-white text-lg">Booking Summary</h3>

              {[
                ['Date', form.date],
                ['Time', form.startTime],
                ['Duration', `${form.hours} hour${form.hours > 1 ? 's' : ''}`],
                ['Occasion', form.occasion],
                ['Location', form.location],
                ['Surge', surgeInfo.label],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-2 border-b border-white/5">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}

              <div className="flex justify-between text-base font-bold py-2">
                <span className="text-white">Total Amount</span>
                <span className="text-gradient">{formatCurrency(total)}</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-400 leading-relaxed">
                <RiShieldCheckLine className="inline mr-1" />
                Your booking will be confirmed after admin verifies your UTR payment screenshot.
                <strong> No adult services</strong> are permitted on this platform.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1">← Edit</button>
                <button onClick={handleConfirm} disabled={busy} className="btn-primary flex-1 py-4 disabled:opacity-60">
                  {busy ? 'Processing…' : 'Confirm & Pay →'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

function FormField({ label, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
        {icon && <span className="text-indigo-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
