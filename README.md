# 🌟 Companio — Safe Social Companionship Platform

> **Production-ready, scalable Next.js + Firebase marketplace for verified social companionship bookings.**

---

## 🎯 What Is Companio?

Companio is a **two-sided marketplace** connecting:
- **Users** who book verified companions for social occasions
- **Companion Providers** who offer professional social companionship

> ⚠️ **Strict Policy: No adult services. Safe, professional, KYC-verified platform only.**

---

## 🗂️ Project Structure

```
companio/
├── pages/
│   ├── index.jsx               # Landing page (Hero, Features, How-it-works, CTA)
│   ├── companions/
│   │   ├── index.jsx           # Browse + filter companions
│   │   └── [id].jsx            # Companion profile detail
│   ├── booking/
│   │   └── [id].jsx            # Booking flow with surge pricing
│   ├── payment/
│   │   └── upload.jsx          # UTR + screenshot payment submission
│   ├── kyc/
│   │   └── index.jsx           # KYC verification wizard (companions)
│   ├── dashboard/
│   │   ├── index.jsx           # User dashboard
│   │   └── companion.jsx       # Companion dashboard
│   ├── admin/
│   │   ├── index.jsx           # Admin dashboard overview
│   │   ├── kyc.jsx             # KYC approval/rejection panel
│   │   ├── payments.jsx        # Payment verification panel
│   │   ├── reports.jsx         # Reports management
│   │   └── featured.jsx        # Featured profiles control
│   ├── auth/
│   │   ├── login.jsx           # Login page
│   │   └── register.jsx        # Register (user / companion)
│   ├── pricing.jsx             # Pricing plans
│   ├── how-it-works.jsx        # Platform guide + FAQ
│   └── report.jsx              # Report a user form
│
├── components/
│   ├── Navbar.jsx              # Sticky glassmorphism navbar
│   ├── Footer.jsx              # Full footer with links
│   ├── CompanionCard.jsx       # Premium companion card with hover effects
│   ├── TrustBanner.jsx         # Animated safety trust strip
│   └── admin/
│       └── AdminLayout.jsx     # Admin sidebar layout
│
├── contexts/
│   └── AuthContext.jsx         # Firebase auth + Firestore user state
│
├── lib/
│   ├── firebase.js             # Firebase init + full schema docs
│   └── utils.js                # Surge pricing, formatting, validation
│
├── styles/
│   └── globals.css             # Full glassmorphism design system
│
├── firestore.rules             # Production Firestore security rules
├── storage.rules               # Firebase Storage security rules
├── tailwind.config.js          # Custom design tokens
├── next.config.js              # Next.js config + security headers
└── .env.example                # Environment variables template
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/companio.git
cd companio
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore Database**
4. Enable **Firebase Storage**
5. Copy your config credentials

### 3. Environment Variables

```bash
cp .env.example .env.local
# Fill in your Firebase credentials in .env.local
```

### 4. Deploy Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules,storage:rules
```

### 5. Create Admin Account

After registering any user:
```javascript
// In Firebase console → Firestore → users/{uid}
// Update the role field:
{ role: "admin" }
```

### 6. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🎨 Design System

### Theme: Dark Luxury Glassmorphism

| Token | Value |
|-------|-------|
| Background | `#06060a` (jet black) |
| Card | `rgba(22,22,42,0.85)` with blur |
| Primary | `#6366f1` (indigo) |
| Accent | `#10b981` (emerald) |
| Glow | `rgba(99,102,241,0.35)` |

### Key CSS Classes
- `.glass-card` — Glassmorphism card with hover lift
- `.glass-nav` — Sticky blurred navigation
- `.glass-input` — Frosted form inputs
- `.btn-primary` — Indigo gradient CTA button
- `.btn-emerald` — Emerald gradient button
- `.badge-verified` — Emerald verified badge
- `.badge-featured` — Indigo featured badge
- `.trust-strip` — Animated safety marquee

---

## 💰 Business Model

### Revenue Streams

| Stream | Details |
|--------|---------|
| Platform Commission | 15% on all completed bookings |
| User Premium Plan | ₹499/month — priority bookings |
| Companion Premium Plan | ₹999/month — unlimited bookings + featured |
| Featured Profile Boost | ₹499 (7d) / ₹1,499 (30d) / ₹3,999 (90d) |
| Surge Pricing | 1.15× evenings, 1.25× weekends, 1.5× weekend evenings |

---

## 📊 Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | All user accounts (users + companions + admins) |
| `companions` | Companion profile data and stats |
| `kyc` | KYC documents and verification status |
| `bookings` | All booking records with full lifecycle |
| `payments` | UTR + screenshot payment records |
| `reviews` | User ratings and reviews for companions |
| `reports` | Safety reports against users |
| `messages/{chatId}/msgs` | In-app messaging |

Full schema documented in `lib/firebase.js`.

---

## 🛡️ Safety Architecture

1. **KYC Verification** — Aadhaar + selfie, admin approval required
2. **Payment Verification** — Manual UTR + screenshot review before booking confirmation
3. **Report System** — Users/companions can report with admin action within 24h
4. **Firestore Rules** — Field-level security rules for all collections
5. **Admin Panel** — Full oversight of KYC, payments, bookings, reports
6. **Trust Banner** — Always-visible "No Adult Services" messaging
7. **Security Headers** — XSS, clickjacking, MIME-type protections via Next.js

---

## ⚡ Scaling Considerations

### Phase 1 (MVP): 0–10K users
- Firebase free tier sufficient
- Manual KYC and payment review

### Phase 2 (Growth): 10K–100K users
- Firebase Blaze plan
- Implement Cloud Functions for:
  - Auto email notifications
  - Surge pricing calculation
  - Review aggregation
- Add Algolia for companion search

### Phase 3 (Scale): 100K+ users
- Implement Redis caching for companion listings
- Add CDN for media (Cloudflare)
- Stripe/Razorpay for automated payments
- Machine learning for featured recommendations

---

## 🔧 Recommended Extensions

```bash
# Automated payments (replace UTR system for scale)
npm install razorpay

# SMS notifications for bookings
npm install twilio

# Email notifications
npm install nodemailer @sendgrid/mail

# Advanced search
npm install algoliasearch instantsearch.js

# Analytics
npm install @vercel/analytics
```

---

## 📱 Pages Summary

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, testimonials |
| `/companions` | Browse + filter marketplace |
| `/companions/[id]` | Companion profile with booking CTA |
| `/booking/[id]` | Multi-step booking flow + surge pricing |
| `/payment/upload` | UTR + screenshot payment submission |
| `/kyc` | 4-step KYC wizard for companions |
| `/dashboard` | User booking dashboard |
| `/dashboard/companion` | Companion earnings dashboard |
| `/admin` | Admin overview with live stats |
| `/admin/kyc` | KYC approval panel |
| `/admin/payments` | Payment verification panel |
| `/admin/reports` | Reports management |
| `/admin/featured` | Featured profile control |
| `/pricing` | Plans for users and companions |
| `/how-it-works` | Platform guide + FAQ |
| `/report` | Report a user form |

---

## ⚖️ Legal & Compliance

- Companio operates under strict **no adult services** policy
- All companions are 18+ verified via government ID (Aadhaar)
- Platform is compliant with Indian IT Act regulations
- GDPR-inspired privacy design (data minimization, user rights)
- KYC data encrypted at rest in Firebase Storage

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Copyright © 2025 Companio Technologies Pvt. Ltd.
All rights reserved.

---

*Built with ❤️ in India 🇮🇳 — Safe Social Companionship Only*
