# VT Eating

A web application for Virginia Tech students to request or fulfill meal deliveries from VT dining halls. Only `@vt.edu` emails.

- **Request a meal**: Pick dining hall & restaurant, describe your meal. $6 total.
- **Fulfill orders**: Pick up & deliver. Earn $5 per order ($1 platform fee).
- **Dual confirmation**: Both requester and fulfiller must confirm completion.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: Email OTP for @vt.edu only
- **Payments**: Stripe

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your database URL, JWT_SECRET, Resend key, Stripe keys
```

### 3. Database

```bash
npx prisma db push
# Or: npx prisma migrate dev
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

**Local development** (Postgres + app):

```bash
docker-compose up -d
```

**Production build** (AWS / Raspberry Pi):

```bash
docker build -t vt-eating .
docker run -p 3000:3000 -e DATABASE_URL=... -e JWT_SECRET=... vt-eating
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for session tokens |
| `RESEND_API_KEY` | For sending OTP emails |
| `FROM_EMAIL` | Sender for emails |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Virginia Tech Dining Halls

Data sourced from [dining.vt.edu/dining_centers.html](https://dining.vt.edu/dining_centers.html):

- Dietrick Hall
- Ducky's at Graduate Life Center
- Hokie Grill at Owens Hall
- Owens Food Court at Owens Hall
- Perry Place at Hitt Hall
- Squires Food Court
- Turner Place at Lavery Hall
- Viva Market at Johnston Student Center
- Viva Too at Goodwin Hall
- West End at Cochrane Hall

## Security

- @vt.edu email validation
- Bcrypt password hashing
- JWT session cookies (httpOnly, secure in prod)
- Parameterized queries (no SQL injection)
- Server-side input validation (Zod)
- Stripe for payments (no card data stored)

## License

Private project for Virginia Tech community.
