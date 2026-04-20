// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setProfile(snap.data());
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Register ──────────────────────────────────────────
  async function register({ name, email, password, phone, role = 'user' }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const userData = {
      uid: cred.user.uid,
      name,
      email,
      phone,
      role,       // 'user' | 'companion'
      plan: 'free',
      planExpiresAt: null,
      avatar: '',
      isBlocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    if (role === 'companion') {
      await setDoc(doc(db, 'companions', cred.user.uid), {
        uid: cred.user.uid,
        displayName: name,
        gender: 'other',
        age: 18,
        city: '',
        bio: '',
        photos: [],
        languages: [],
        interests: [],
        hourlyRate: 500,
        rating: 0,
        reviewCount: 0,
        isVerified: false,
        isFeatured: false,
        featuredUntil: null,
        plan: 'free',
        planExpiresAt: null,
        bookingsCount: 0,
        availableDays: [],
        availableHours: { start: '10:00', end: '20:00' },
        isActive: false,
        isBlocked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    setProfile(userData);
    return cred.user;
  }

  // ── Login ─────────────────────────────────────────────
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) setProfile(snap.data());
    return cred.user;
  }

  // ── Logout ────────────────────────────────────────────
  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  // ── Password Reset ────────────────────────────────────
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
    toast.success('Password reset email sent!');
  }

  // ── Refresh profile ───────────────────────────────────
  async function refreshProfile() {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) setProfile(snap.data());
  }

  // ── Update profile ────────────────────────────────────
  async function updateUserProfile(data) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    await refreshProfile();
  }

  const isAdmin     = profile?.role === 'admin';
  const isCompanion = profile?.role === 'companion';
  const isPremium   = profile?.plan === 'premium';

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      register, login, logout, resetPassword,
      updateUserProfile, refreshProfile,
      isAdmin, isCompanion, isPremium,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
