# BeThere — Sydney Events Radar

Scrapes public event sources for Sydney, Australia, stores them in Convex, and renders a clean event listing UI with an admin dashboard for review/import.

## Features
- Multi-source scraping (Eventbrite, Meetup, Time Out Sydney, What’s On Sydney)
- Auto-updates: new/updated/inactive tags
- Public listing at `/sydney` with GET TICKETS flow (email + consent)
- Admin dashboard at `/dashboard` with filters and import action
- Google OAuth via Clerk

## Requirements
- Node.js 18+
- Convex project
- Clerk project (Google OAuth enabled)

## Setup
```bash
npm install
npx convex dev
npm run dev
```

## Environment Variables
Create `.env.local`:
```
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_ADMIN_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_JWT_ISSUER_DOMAIN=

# Optional
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=
GEMINI_API_KEY=
CRON_SECRET=
```

## Scraping
Run manually:
```bash
npm run scrape:sydney
```

Vercel cron endpoint:
```
/api/cron/scrape
```
If `CRON_SECRET` is set, send:
```
Authorization: Bearer <CRON_SECRET>
```

## Key Routes
- `/sydney` — public event listing
- `/dashboard` — admin review/import (auth required)
- `/explore` — main explore page

## Notes
- Scraped images are proxied via `/api/image?url=...` to avoid hotlink blocks.
- Location slugs are generated as `city-state-country` when available.
