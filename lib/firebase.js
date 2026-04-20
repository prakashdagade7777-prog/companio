// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';
import { getStorage }    from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;

/*
 * ────────────────────────────────────────────────────────────────────────────
 *  FIRESTORE COLLECTIONS SCHEMA
 * ────────────────────────────────────────────────────────────────────────────
 *
 *  users/{uid}
 *    ├─ uid: string
 *    ├─ email: string
 *    ├─ name: string
 *    ├─ phone: string
 *    ├─ avatar: string (url)
 *    ├─ role: 'user' | 'companion' | 'admin'
 *    ├─ plan: 'free' | 'premium'
 *    ├─ planExpiresAt: timestamp | null
 *    ├─ isBlocked: boolean
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  companions/{uid}
 *    ├─ uid: string
 *    ├─ displayName: string
 *    ├─ gender: 'male' | 'female' | 'other'
 *    ├─ age: number
 *    ├─ city: string
 *    ├─ bio: string
 *    ├─ photos: string[]  (urls)
 *    ├─ languages: string[]
 *    ├─ interests: string[]
 *    ├─ hourlyRate: number
 *    ├─ rating: number
 *    ├─ reviewCount: number
 *    ├─ isVerified: boolean (KYC approved)
 *    ├─ isFeatured: boolean
 *    ├─ featuredUntil: timestamp | null
 *    ├─ plan: 'free' | 'premium'
 *    ├─ planExpiresAt: timestamp | null
 *    ├─ bookingsCount: number
 *    ├─ availableDays: string[]
 *    ├─ availableHours: { start: string, end: string }
 *    ├─ isActive: boolean
 *    ├─ isBlocked: boolean
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  kyc/{uid}
 *    ├─ uid: string
 *    ├─ aadhaarNumber: string
 *    ├─ aadhaarFront: string (url)
 *    ├─ aadhaarBack: string (url)
 *    ├─ selfieUrl: string (url)
 *    ├─ status: 'pending' | 'approved' | 'rejected'
 *    ├─ adminNote: string
 *    ├─ submittedAt: timestamp
 *    └─ reviewedAt: timestamp | null
 *
 *  bookings/{bookingId}
 *    ├─ bookingId: string (uuid)
 *    ├─ userId: string
 *    ├─ companionId: string
 *    ├─ userSnapshot: { name, avatar }
 *    ├─ companionSnapshot: { displayName, avatar, city }
 *    ├─ date: string (ISO)
 *    ├─ startTime: string
 *    ├─ endTime: string
 *    ├─ hours: number
 *    ├─ location: string
 *    ├─ occasion: string
 *    ├─ notes: string
 *    ├─ baseRate: number
 *    ├─ surgeMultiplier: number
 *    ├─ totalAmount: number
 *    ├─ status: 'pending_payment' | 'pending_verification' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'
 *    ├─ paymentId: string | null
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  payments/{paymentId}
 *    ├─ paymentId: string
 *    ├─ bookingId: string
 *    ├─ userId: string
 *    ├─ amount: number
 *    ├─ utrNumber: string
 *    ├─ screenshotUrl: string (url)
 *    ├─ status: 'pending' | 'approved' | 'rejected'
 *    ├─ adminNote: string
 *    ├─ submittedAt: timestamp
 *    └─ verifiedAt: timestamp | null
 *
 *  reviews/{reviewId}
 *    ├─ reviewId: string
 *    ├─ bookingId: string
 *    ├─ userId: string
 *    ├─ companionId: string
 *    ├─ rating: number (1-5)
 *    ├─ comment: string
 *    ├─ isVisible: boolean
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  reports/{reportId}
 *    ├─ reportId: string
 *    ├─ reportedBy: string (uid)
 *    ├─ reportedUser: string (uid)
 *    ├─ type: 'harassment' | 'inappropriate_behavior' | 'fraud' | 'spam' | 'other'
 *    ├─ description: string
 *    ├─ status: 'open' | 'investigating' | 'resolved' | 'dismissed'
 *    ├─ adminNote: string
 *    ├─ createdAt: timestamp
 *    └─ resolvedAt: timestamp | null
 *
 *  messages/{chatId}/msgs/{msgId}
 *    ├─ chatId: string  (userId_companionId sorted)
 *    ├─ senderId: string
 *    ├─ text: string
 *    ├─ type: 'text' | 'image'
 *    ├─ isRead: boolean
 *    └─ createdAt: timestamp
 */
