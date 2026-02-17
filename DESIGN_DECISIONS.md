# VT Eating - Design Decisions & Constraints

## Final Choices (Implemented)

1. **Dining halls**: VT official list from https://dining.vt.edu/dining_centers.html
2. **Payment**: Stripe
3. **Order verification**: Dual confirmation (requester + fulfiller)
4. **Platform**: Web-first responsive
5. **Auth**: Email OTP for @vt.edu
6. **Hosting**: AWS or Raspberry Pi (Docker ready)
7. **Roles**: Users can request AND fulfill; separate pages

---

## Original Questions (Resolved)

### 1. **Virginia Tech Dining Halls & Restaurants**
- Do you have an official list of dining halls and their restaurants?
- Should this be hardcoded, configurable via admin panel, or fetched from an external VT API?
- *Proposed default*: Configurable JSON/config that can be easily updated (Owens, D2, West End, Turner, etc.)

### 2. **Payment Processing**
- How should the $6 payment flow work?
  - **Option A**: Stripe/PayPal integration (user pays when placing order, funds held in escrow until verified)
  - **Option B**: University billing integration (if VT has a meal plan or campus currency)
  - **Option C**: Manual/Venmo (user and fulfiller handle payment offline; app just tracks completion)
  - **Option D**: In-app wallet (users pre-load balance)
- *Proposed default*: Stripe with escrow-style flow for security and scalability

### 3. **Order Verification**
- How should we verify an order was fulfilled?
  - **Option A**: Photo proof (fulfiller uploads receipt/meal photo)
  - **Option B**: Dual confirmation (both requester and fulfiller must confirm)
  - **Option C**: QR code handoff (app generates code, requester scans at delivery)
  - **Option D**: Time-based + dual confirmation (requester marks received, fulfiller already confirmed pickup)
- *Proposed default*: Dual confirmation + optional photo proof

### 4. **Mobile vs Web**
- Build priority: Web-first responsive, or mobile-native?
  - **Option A**: Web-first (responsive React/Next.js) — works on all devices, single codebase
  - **Option B**: React Native / Expo — true mobile apps + web
  - **Option C**: Progressive Web App (PWA) — installable, works offline for some flows
- *Proposed default*: Web-first responsive (faster to ship), PWA-capable for "Add to Home Screen"

### 5. **Virginia Tech Authentication**
- @vt.edu email verification only, or integrate with VT SSO/CAS?
  - **Option A**: Email verification only (OTP sent to @vt.edu)
  - **Option B**: VT SSO if available (more secure, requires VT partnership)
- *Proposed default*: Email OTP verification (no VT partnership required initially)

### 6. **Hosting & Infrastructure**
- Deployment target: Vercel, AWS, university servers, or undecided?
- *Proposed default*: Vercel (frontend) + Supabase/PostgreSQL (backend + auth + DB) for rapid development

### 7. **User Roles**
- Can a user both request and fulfill, or are roles separate?
- *Proposed default*: Same user can do both (maximize liquidity)

---

## Proposed Architecture (Pending Your Approval)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Web + PWA)                           │
│  Next.js 14 (App Router) + React + TypeScript + Tailwind CSS     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER                                    │
│  Next.js API Routes / tRPC / or REST (your preference)          │
│  Rate limiting, input validation, auth middleware                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                            │
│  Auth (Supabase Auth / NextAuth) | Payment (Stripe) | File Store │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE                                     │
│  PostgreSQL (Supabase / Neon / Railway)                          │
│  Proper indexing, migrations, backups                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Principles (Will Implement)

- **Authentication**: JWT with short expiry, refresh tokens, @vt.edu domain validation
- **Authorization**: Role-based access, resource ownership checks
- **Data Protection**: TLS everywhere, encrypted secrets, parameterized queries (no SQL injection)
- **Input Validation**: Server-side validation, sanitization, rate limiting
- **Sensitive Data**: Passwords hashed (bcrypt/Argon2), payment tokens never stored
- **CORS, CSP, XSS**: Secure headers, Content-Security-Policy

---

## Database Schema (Draft)

```
users (id, email, hashed_password, created_at, ...)
meal_requests (id, requester_id, dining_hall, restaurant, meal_description, status, created_at)
fulfillments (id, request_id, fulfiller_id, status, payment_released_at)
payments (id, request_id, amount, stripe_payment_intent_id, status)
dining_config (dining_hall, restaurants[]) — configurable
```

---

**Please review and answer the numbered questions above.**  
Once you respond, I will proceed with implementation according to your choices.
