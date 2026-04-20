// pages/kyc/index.jsx
import { useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { validateAadhaar } from '../../lib/utils';
import toast from 'react-hot-toast';
import {
  RiShieldCheckLine, RiUploadCloud2Line, RiCloseLine,
  RiIdCardLine, RiCameraLine, RiCheckboxCircleLine,
  RiInformationLine, RiArrowRightLine, RiArrowLeftLine,
} from 'react-icons/ri';

const STEPS = ['Identity', 'Documents', 'Selfie', 'Review'];

export default function KYCPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [step,   setStep]   = useState(0);
  const [busy,   setBusy]   = useState(false);
  const [done,   setDone]   = useState(false);

  const [form, setForm] = useState({
    aadhaarNumber: '',
    aadhaarFront: null,
    aadhaarBack:  null,
    selfie:       null,
    frontPreview: '',
    backPreview:  '',
    selfiePreview:'',
  });

  const frontRef  = useRef();
  const backRef   = useRef();
  const selfieRef = useRef();

  const handleFile = (key, previewKey) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Images only');
    if (f.size > 5 * 1024 * 1024) return toast.error('Max 5MB');
    setForm(p => ({ ...p, [key]: f, [previewKey]: URL.createObjectURL(f) }));
  };

  const canProceed = [
    true, // step 0 always
    form.aadhaarNumber.replace(/\s/g, '').length === 12,
    form.aadhaarFront && form.aadhaarBack,
    form.selfie,
  ][step];

  const uploadFile = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!user) return router.push('/auth/login');
    setBusy(true);
    try {
      const uid = user.uid;
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadFile(form.aadhaarFront,  `kyc/${uid}/aadhaar_front`),
        uploadFile(form.aadhaarBack,   `kyc/${uid}/aadhaar_back`),
        uploadFile(form.selfie,        `kyc/${uid}/selfie`),
      ]);

      await setDoc(doc(db, 'kyc', uid), {
        uid,
        aadhaarNumber: form.aadhaarNumber.replace(/\s/g, ''),
        aadhaarFront:  frontUrl,
        aadhaarBack:   backUrl,
        selfieUrl,
        status:        'pending',
        adminNote:     '',
        submittedAt:   serverTimestamp(),
        reviewedAt:    null,
      });

      setDone(true);
      toast.success('KYC submitted! We\'ll review within 24 hours.');
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <RiCheckboxCircleLine className="text-emerald-400 text-4xl" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-3">KYC Submitted!</h2>
          <p className="text-gray-400 text-sm mb-5 leading-relaxed">
            Your identity documents are under review. Our team will verify them within <strong className="text-white">24 hours</strong>.
            You'll receive an email once approved.
          </p>
          <div className="space-y-2 text-xs text-left bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4 mb-6">
            <p className="text-gray-400">✓ Aadhaar documents uploaded</p>
            <p className="text-gray-400">✓ Selfie photo uploaded</p>
            <p className="text-gray-400">✓ Pending admin approval</p>
          </div>
          <button onClick={() => router.push('/dashboard/companion')} className="btn-primary w-full py-3">
            Go to Dashboard →
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Head><title>KYC Verification – Companio</title></Head>
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
            <RiShieldCheckLine className="text-white text-2xl" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Identity Verification</h1>
          <p className="text-gray-500 text-sm">Complete KYC to activate your companion profile and start earning.</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < step  ? 'bg-emerald-500 text-white' :
                  i === step ? 'bg-indigo-500 text-white shadow-glow-sm' :
                  'bg-white/10 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${i === step ? 'text-indigo-400' : 'text-gray-600'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 transition-all duration-300 ${i < step ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6">
          <AnimatePresence mode="wait">

            {/* ── Step 0: Intro ── */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="font-semibold text-white text-lg">What You'll Need</h2>
                {[
                  { icon: <RiIdCardLine />, title: 'Aadhaar Card', desc: 'Clear photos of front and back of your Aadhaar card.' },
                  { icon: <RiCameraLine />, title: 'Live Selfie', desc: 'A clear selfie photo taken right now (not from gallery, ideally).' },
                  { icon: <RiInformationLine />, title: 'Requirements', desc: 'Must be 18+ years old. Information must match your documents.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                    <div className="text-indigo-400 text-xl mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-0.5">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-600">
                  <RiShieldCheckLine className="inline mr-1" />
                  Your documents are encrypted and stored securely. Only used for identity verification.
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Aadhaar Number ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h2 className="font-semibold text-white text-lg">Enter Aadhaar Number</h2>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">12-digit Aadhaar Number</label>
                  <input
                    type="text"
                    className="glass-input font-mono text-lg tracking-[0.2em]"
                    placeholder="XXXX XXXX XXXX"
                    value={form.aadhaarNumber}
                    maxLength={14}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 12);
                      v = v.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3').trim();
                      setForm(p => ({ ...p, aadhaarNumber: v }));
                    }}
                  />
                  {form.aadhaarNumber.replace(/\s/g, '').length === 12 && (
                    <p className="text-xs text-emerald-400 mt-1">✓ Valid Aadhaar format</p>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  Your Aadhaar number is securely stored and used only for identity verification purposes.
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Aadhaar Photos ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h2 className="font-semibold text-white text-lg">Upload Aadhaar Card</h2>
                {[
                  { label: 'Front Side', key: 'aadhaarFront', previewKey: 'frontPreview',  refEl: frontRef },
                  { label: 'Back Side',  key: 'aadhaarBack',  previewKey: 'backPreview',   refEl: backRef  },
                ].map(({ label, key, previewKey, refEl }) => (
                  <div key={label}>
                    <label className="text-xs text-gray-400 mb-2 block">{label}</label>
                    <input ref={refEl} type="file" accept="image/*" onChange={handleFile(key, previewKey)} className="hidden" />
                    {form[previewKey] ? (
                      <div className="relative rounded-xl overflow-hidden border border-indigo-500/20 h-36">
                        <img src={form[previewKey]} alt={label} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, [key]: null, [previewKey]: '' }))}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white"
                        >
                          <RiCloseLine />
                        </button>
                        <div className="absolute bottom-2 left-2 text-xs bg-black/70 text-emerald-400 px-2 py-1 rounded">✓ Uploaded</div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => refEl.current?.click()}
                        className="w-full h-36 rounded-xl border-2 border-dashed border-indigo-500/20 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-indigo-400 transition-all duration-200"
                      >
                        <RiUploadCloud2Line className="text-3xl" />
                        <span className="text-sm">Upload {label}</span>
                        <span className="text-xs">JPG, PNG – Max 5MB</span>
                      </button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Step 3: Selfie ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h2 className="font-semibold text-white text-lg">Upload Your Selfie</h2>
                <p className="text-sm text-gray-500">Take a clear selfie with good lighting. Face must be clearly visible.</p>
                <input ref={selfieRef} type="file" accept="image/*" capture="user" onChange={handleFile('selfie', 'selfiePreview')} className="hidden" />
                {form.selfiePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 aspect-square max-w-xs mx-auto">
                    <img src={form.selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, selfie: null, selfiePreview: '' }))}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white"
                    >
                      <RiCloseLine />
                    </button>
                    <div className="absolute bottom-3 left-3 text-xs bg-black/70 text-emerald-400 px-2 py-1 rounded">✓ Photo ready</div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => selfieRef.current?.click()}
                    className="w-full aspect-square max-w-xs mx-auto rounded-2xl border-2 border-dashed border-indigo-500/20 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-indigo-400 transition-all duration-200 block"
                  >
                    <RiCameraLine className="text-4xl" />
                    <span className="text-sm font-medium">Take / Upload Selfie</span>
                    <span className="text-xs">Clear face photo required</span>
                  </button>
                )}
                <div className="text-xs text-gray-600 space-y-1">
                  <p>✓ Face clearly visible, no sunglasses</p>
                  <p>✓ Good lighting, no blur</p>
                  <p>✓ Recent photo (not older than 3 months)</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-5 border-t border-white/5">
            {step > 0 && (
              <button onClick={() => setStep(p => p - 1)} className="btn-ghost flex items-center gap-2">
                <RiArrowLeftLine /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(p => p + 1)}
                disabled={!canProceed}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Continue <RiArrowRightLine />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={busy || !form.selfie}
                className="btn-emerald flex-1 disabled:opacity-40"
              >
                {busy ? 'Submitting…' : 'Submit for Verification →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
