// pages/payment/upload.jsx
import { useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, validateUTR } from '../../lib/utils';
import toast from 'react-hot-toast';
import { v4 as uuid } from 'uuid';
import {
  RiUploadCloud2Line, RiShieldCheckLine, RiBankLine,
  RiCheckboxCircleLine, RiImageLine, RiCloseLine,
} from 'react-icons/ri';

const UPI_QR_PLACEHOLDER = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=companio@ybl&pn=Companio&am=';

export default function PaymentUploadPage() {
  const { user, profile }  = useAuth();
  const router             = useRouter();
  const { booking, amount} = router.query;

  const [utr,       setUtr]       = useState('');
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState('');
  const [busy,      setBusy]      = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Only image files allowed');
    if (f.size > 5 * 1024 * 1024) return toast.error('File too large (max 5MB)');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return router.push('/auth/login');
    if (!validateUTR(utr)) return toast.error('Enter a valid UTR/reference number (12-22 digits)');
    if (!file)             return toast.error('Please upload payment screenshot');
    if (!booking)          return toast.error('Invalid booking. Please try again.');

    setBusy(true);
    try {
      // Upload screenshot to Firebase Storage
      const paymentId   = uuid();
      const storageRef  = ref(storage, `payments/${paymentId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const screenshotUrl = await getDownloadURL(storageRef);

      // Create payment record
      await addDoc(collection(db, 'payments'), {
        paymentId,
        bookingId:     booking,
        userId:        user.uid,
        amount:        Number(amount) || 0,
        utrNumber:     utr.trim(),
        screenshotUrl,
        status:        'pending',
        adminNote:     '',
        submittedAt:   serverTimestamp(),
        verifiedAt:    null,
      });

      // Update booking status
      await updateDoc(doc(db, 'bookings', booking), {
        status:    'pending_verification',
        paymentId,
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);
      toast.success('Payment submitted for verification!');
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <RiCheckboxCircleLine className="text-emerald-400 text-3xl" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-3">Payment Submitted!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Your payment of <strong className="text-white">{formatCurrency(Number(amount))}</strong> is under review.
            You'll receive confirmation within 2-4 hours.
          </p>
          <div className="space-y-2 text-xs text-gray-500 mb-6">
            <p>✓ UTR recorded and verified</p>
            <p>✓ Screenshot uploaded</p>
            <p>✓ Admin notified for review</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full py-3">
            Go to Dashboard →
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Complete Payment – Companio</title></Head>
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="font-display font-bold text-3xl text-white mb-2">Complete Payment</h1>
        <p className="text-gray-500 text-sm mb-8">Transfer the amount via UPI or bank, then submit your UTR here.</p>

        {/* Amount card */}
        <div className="glass-card p-5 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1">Amount Due</div>
            <div className="font-display font-bold text-3xl text-gradient">{formatCurrency(Number(amount) || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Booking ID</div>
            <div className="text-xs font-mono text-indigo-400">{booking?.slice(0, 12)}…</div>
          </div>
        </div>

        {/* UPI QR + Bank details */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <RiBankLine className="text-indigo-400" /> Payment Options
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* QR */}
            <div className="text-center">
              <img
                src={`${UPI_QR_PLACEHOLDER}${amount}`}
                alt="UPI QR"
                className="w-36 h-36 mx-auto rounded-xl border border-indigo-500/20 mb-2"
              />
              <p className="text-xs text-gray-500">Scan with any UPI app</p>
            </div>

            {/* Bank details */}
            <div className="space-y-3">
              {[
                ['UPI ID', 'companio@ybl'],
                ['Bank',   'HDFC Bank'],
                ['A/C No', '1234567890123'],
                ['IFSC',   'HDFC0001234'],
                ['Name',   'Companio Tech Pvt Ltd'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] text-gray-600 uppercase tracking-widest">{k}</div>
                  <div className="text-xs font-mono text-white">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UTR Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          <h3 className="font-semibold text-white">Submit Payment Proof</h3>

          {/* UTR */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">UTR / Reference Number</label>
            <input
              type="text"
              className="glass-input font-mono"
              placeholder="12-22 digit transaction reference"
              value={utr}
              onChange={e => setUtr(e.target.value)}
              maxLength={22}
            />
            <p className="text-[10px] text-gray-600 mt-1">Find this in your UPI/bank app transaction history</p>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Payment Screenshot</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-indigo-500/20">
                <img src={preview} alt="Screenshot" className="w-full max-h-60 object-contain bg-brand-darker" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(''); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white"
                >
                  <RiCloseLine />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-indigo-500/20 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-indigo-400 transition-all duration-200"
              >
                <RiUploadCloud2Line className="text-2xl" />
                <span className="text-sm">Click to upload screenshot</span>
                <span className="text-xs">PNG, JPG, up to 5MB</span>
              </button>
            )}
          </div>

          {/* Safety notice */}
          <div className="flex items-start gap-2 text-xs text-emerald-600">
            <RiShieldCheckLine className="text-base mt-0.5 shrink-0" />
            Payment is verified by our admin team within 2-4 hours. Booking is confirmed only after verification.
          </div>

          <button type="submit" disabled={busy || !utr || !file} className="btn-primary w-full py-4 text-base disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit for Verification →'}
          </button>
        </form>
      </div>
    </>
  );
}
