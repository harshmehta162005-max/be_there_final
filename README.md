<div align="center">

<img src="public/BeThere_logo.png" alt="BeThere Logo" width="180"/>

# BeThere — Discover & Create Amazing Events

**A full-stack event discovery and management platform powered by Next.js, Convex & Clerk**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://betherefinal-4fuywufii-harsh-mehtas-projects-64ee88d3.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.30-orange?style=for-the-badge)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Application Routes](#-application-routes)
- [Scraping Pipeline](#-scraping-pipeline)
- [Tiered Access (Free vs. Pro)](#-tiered-access-free-vs-pro)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**BeThere** is a modern, full-stack event platform that combines two powerful capabilities in a single app:

1. **User-Created Events** — Any authenticated user can create, publish, and manage their own events. Organizers get a personal dashboard with real-time registration stats, QR-code check-in for attendees, and revenue tracking.

2. **Automated Event Discovery (Sydney Radar)** — A multi-source web scraping pipeline automatically pulls Sydney events from Eventbrite, Meetup, Time Out Sydney, and What's On Sydney. Scraped events are stored in Convex, deduplicated, status-tagged (`new`, `updated`, `inactive`, `imported`), and exposed in a clean public listing with a lead-capture "Get Tickets" flow.

The platform is built with a **dark, premium UI**, real-time data via Convex's reactive queries, full Google OAuth via Clerk, and is deployed on Vercel with automated daily cron scraping.

---

## 🔗 Live Demo

> **[https://betherefinal-4fuywufii-harsh-mehtas-projects-64ee88d3.vercel.app/](https://betherefinal-4fuywufii-harsh-mehtas-projects-64ee88d3.vercel.app/)**

---

## ✨ Key Features

### 🎉 Event Creation & Management
- **Create events** with rich metadata: title, description, category, tags, dates, timezone, venue/address, capacity, free/paid ticketing, cover image, and a custom theme color (Pro only).
- **Automatic slug generation** from event title + timestamp for clean, unique URLs.
- **Per-organizer dashboard** showing registrations, check-in rates, pending attendees, and estimated revenue in real time.
- **QR Code check-in** — Every registration generates a unique `EVT-<timestamp>-<random>` QR code. Organizers scan QR codes to mark attendees as checked in.
- **Cancel registrations** — Attendees can cancel and registration counts update automatically.
- **Delete events** — Organizers can delete events; all child registrations are cascade-deleted automatically.

### 🗺️ Explore & Discovery
- **Explore page** with featured, popular, and category-based event listings.
- **Location-based filtering** — Filter events by city, state, or country.
- **Category browsing** — See live event counts per category.
- **Search + location bar** in the header (desktop) and as a persistent mobile element.

### 🔍 Sydney Events Radar
- **Multi-source scraping**: Eventbrite, Meetup, Time Out Sydney, What's On Sydney.
- **Automatic deduplication** using a content hash and `dedupeKey` per event.
- **Smart status tagging**: `new` (first scraped), `updated` (content changed), `inactive` (not seen for 6+ hours), `imported` (promoted by admin).
- **Public `/sydney` listing** — Upcoming Sydney events, sorted by start date, with image proxy to avoid hotlink blocks.
- **"Get Tickets" lead flow** — Users enter email + marketing consent, data is stored in `ticketLeads`, and they are redirected to the original event URL.

### 🛡️ Admin Dashboard (`/dashboard`)
- Protected behind Clerk authentication.
- **Filter scraped events** by city, keyword, date range, and status tag.
- **Preview panel** — Full details for any selected event.
- **"Import to platform" action** — Tags event as `imported`, records who imported it, when, and optional notes. Creates an entry in the `imports` audit table.
- **Scrape status widget** — Last scrape run time, total/new/updated/inactive/imported counts.

### 👤 User Onboarding
- **Two-step onboarding modal** on first login: choose interests (min. 3), then set location (country → state → city via `country-state-city` library).
- Preferences are persisted in Convex and used to personalize the explore feed.

### 🔐 Authentication & Authorization
- **Clerk** handles Google OAuth with a dark-themed UI.
- **Middleware-enforced** protected routes: `/my-events`, `/create-event`, `/my-tickets`, `/dashboard`.
- **Free vs. Pro tier** checked both client-side and server-side using Clerk's `has({ plan })` API.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Database & Backend** | Convex (serverless reactive DB + functions) |
| **Authentication** | Clerk (Google OAuth, JWT) |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` |
| **UI Components** | Radix UI (Dialog, Select, Popover, Tabs, etc.) |
| **Forms** | React Hook Form + Zod v4 validation |
| **AI** | Google Gemini API (`@google/generative-ai`) |
| **Image Source** | Unsplash API |
| **Scraping** | Node.js + Cheerio + chrono-node (date parsing) |
| **QR Codes** | `react-qr-code` (display) + `html5-qrcode` (scanner) |
| **Date Handling** | `date-fns` |
| **Carousel** | Embla Carousel |
| **Notifications** | Sonner (toast) |
| **Deployment** | Vercel |

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js 16)                          │
│                                                                     │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────────┐   │
│  │  Public Pages │  │ Protected Pages  │  │   API Routes         │   │
│  │  /           │  │ /my-events       │  │ /api/cron/scrape     │   │
│  │  /explore    │  │ /create-event    │  │ /api/generate-event  │   │
│  │  /sydney     │  │ /my-tickets      │  │ /api/image           │   │
│  │  /events/[*] │  │ /dashboard       │  └──────────────────────┘   │
│  └──────────────┘  └─────────────────┘                             │
│                                                                     │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐    │
│  │    Clerk (Auth Middleware)   │  │  Convex React Client     │    │
│  │  Google OAuth / JWT verify   │  │  Real-time subscriptions │    │
│  └──────────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                         │                    │
            ┌────────────┘                    └────────────┐
            ▼                                              ▼
  ┌──────────────────┐                     ┌─────────────────────────┐
  │ Clerk Auth SaaS  │                     │    Convex Cloud DB      │
  │ (User identity,  │                     │  (Serverless functions, │
  │  plan/org data)  │                     │   reactive queries,     │
  └──────────────────┘                     │   mutations, indexes)   │
                                           └─────────────────────────┘
                                                       ▲
                                                       │
                                        ┌──────────────┴────────┐
                                        │  Scraping Pipeline    │
                                        │  Node.js + Cheerio    │
                                        │  (Cron: 03:00 daily)  │
                                        │  or manual npm run    │
                                        └───────────────────────┘
```

---

## 🗄️ Database Schema

All tables are defined in [`convex/schema.js`](convex/schema.js) using Convex's typed schema DSL.

### `users`
| Field | Type | Description |
|---|---|---|
| `name` | `string` | Display name from Clerk |
| `email` | `string` | User's email |
| `tokenIdentifier` | `string` | Clerk JWT token identifier (unique) |
| `imageUrl` | `string?` | Profile picture URL |
| `hasCompletedOnboarding` | `boolean` | Whether onboarding wizard was finished |
| `location` | `{ city, country, state? }?` | User's preferred location |
| `interests` | `string[]?` | Selected interest category IDs |
| `freeEventsCreated` | `number` | Counter for free tier event limit enforcement |

**Indexes:** `by_token` on `tokenIdentifier`

---

### `events`
| Field | Type | Description |
|---|---|---|
| `title`, `description`, `slug` | `string` | Core event info |
| `organizerId` / `organizerName` | ID / string | Creator reference |
| `category`, `tags` | string / string[] | Classification |
| `startDate`, `endDate`, `timezone` | number / string | Timing |
| `locationType` | `"online" \| "physical"` | Format |
| `venue`, `address`, `city`, `state`, `country` | `string?` | Location details |
| `capacity`, `registrationCount` | `number` | Attendance tracking |
| `ticketType`, `ticketPrice` | union / number? | Monetization |
| `coverImage`, `themeColor` | `string?` | Visual branding |

**Indexes:** `by_organizer`, `by_slug`, `by_category`, `by_start_date`  
**Search Index:** `search_title`

---

### `registrations`
| Field | Type | Description |
|---|---|---|
| `eventId`, `userId` | ID | Foreign keys |
| `attendeeName`, `attendeeEmail` | `string` | Attendee details |
| `qrCode` | `string` | Unique check-in code (`EVT-…`) |
| `checkedIn`, `checkedInAt` | boolean / number? | Check-in state |
| `status` | `"confirmed" \| "cancelled"` | Registration status |

**Indexes:** `by_user`, `by_event`, `by_event_user`, `by_qr_code`

---

### `scrapedEvents`
| Field | Type | Description |
|---|---|---|
| `title`, `description` | `string` | Event content |
| `startDate`, `endDate?` | `number` | Unix timestamps |
| `venueName`, `address`, `city`, `country` | string | Location |
| `sourceName`, `sourceUrl`, `sourceEventId?` | string | Origin |
| `dedupeKey` | `string` | Hash key for deduplication |
| `contentHash` | `string` | Detects content changes |
| `statusTags` | `string[]` | `new`, `updated`, `inactive`, `imported` |
| `lastScrapedAt`, `lastSeenAt` | `number` | Staleness tracking |
| `importedAt`, `importedBy`, `importNotes` | optional | Import audit |

**Indexes:** `by_dedupe`, `by_city`, `by_source`, `by_status`, `by_start_date`

---

### `ticketLeads`
Stores email captures from the `/sydney` "Get Tickets" flow.

| Field | Type |
|---|---|
| `scrapedEventId` | `id("scrapedEvents")` |
| `email` | `string` |
| `consent` | `boolean` |
| `sourceUrl` | `string` |

---

### `imports`
Audit log for admin import actions.

| Field | Type |
|---|---|
| `scrapedEventId` | `id("scrapedEvents")` |
| `importedAt` | `number` |
| `importedBy` | `id("users")` |
| `importNotes?` | `string` |

---

### `scrapeRuns`
Metadata for each completed scrape run.

| Field | Type |
|---|---|
| `startedAt` / `finishedAt` | `number` |
| `total` | `number` |
| `sources` | `string[]` |

---

## 🗺️ Application Routes

### Public Routes
| Route | Description |
|---|---|
| `/` | Landing page — hero section with CTA |
| `/explore` | Discover events: featured, popular, by category, by location |
| `/events/[slug]` | Individual event detail page |
| `/sydney` | Public Sydney events listing (scraped) |
| `/sign-in` | Clerk-hosted sign-in page |
| `/sign-up` | Clerk-hosted sign-up page |

### Protected Routes *(Clerk auth required)*
| Route | Description |
|---|---|
| `/create-event` | Multi-step event creation wizard |
| `/my-events` | Organizer's event list + management |
| `/my-events/[id]/dashboard` | Per-event analytics, registrations, QR check-in |
| `/my-tickets` | Tickets the user has registered for |
| `/dashboard` | Admin scraping dashboard for Sydney events |

### API Routes
| Route | Method | Description |
|---|---|---|
| `/api/cron/scrape` | `GET` | Vercel cron trigger — runs scraping pipeline (daily at 03:00 UTC) |
| `/api/generate-event` | `POST` | AI-assisted event generation via Gemini API |
| `/api/image` | `GET` | Image proxy for scraped event images (`?url=...`) |

---

## 🕷️ Scraping Pipeline

The scraping system lives in `lib/scrape/sydney.mjs` and is orchestrated by `scripts/scrape-sydney.mjs`.

### Flow

```
Vercel Cron (03:00 UTC daily)
  → /api/cron/scrape
     → scrapeSydneySources()            # lib/scrape/sydney.mjs
        ├── scrapeEventbrite()
        ├── scrapeMeetup()
        ├── scrapeTimeOutSydney()
        └── scrapeWhatsOnSydney()
     → Normalize & hash events
     → convex.upsertScrapedEvents()     # Insert or diff-update
     → convex.markInactiveForSource()   # Mark stale events inactive
     → convex.createScrapeRun()         # Log the run metadata
```

### Status Tag Logic

| Tag | When Applied |
|---|---|
| `new` | Event is first seen (inserted fresh) |
| `updated` | `contentHash` differs from stored version |
| `inactive` | Event not seen for ≥ 6 hours during a scrape run |
| `imported` | Admin explicitly imported via `/dashboard` |

> Tags are **additive** — an event can carry multiple tags simultaneously (e.g., `new`, `imported`).

### Manual Scraping

```bash
npm run scrape:sydney
```

Requires `CONVEX_ADMIN_KEY` and `NEXT_PUBLIC_CONVEX_URL` in `.env.local`.

---

## 💎 Tiered Access (Free vs. Pro)

BeThere uses Clerk's **plan-based organizations** to gate features.

| Feature | Free | Pro |
|---|---|---|
| Create events | ✅ (1 event max) | ✅ Unlimited |
| Custom theme color | ❌ (forced `#1e3a8a`) | ✅ Any color |
| Pro badge in header | ❌ | ✅ |
| All other features | ✅ | ✅ |

> **Enforcement is server-side** — `createEvent` mutation in Convex re-validates both the event count and theme color, even if the client bypasses the check.

---

## 🔌 API Endpoints

### `GET /api/cron/scrape`
Triggers the Sydney scraping pipeline. Protected by an optional `CRON_SECRET`.

```
Authorization: Bearer <CRON_SECRET>
```

### `POST /api/generate-event`
Uses the Gemini API to generate event details from a prompt. Requires auth.

### `GET /api/image?url=<encoded-url>`
Proxies a remote image to avoid CORS/hotlink blocking. Used by scraped event cards.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- A **Convex** account and project — [convex.dev](https://convex.dev)
- A **Clerk** application with Google OAuth enabled — [clerk.com](https://clerk.com)
- (Optional) **Unsplash** API key for image picking
- (Optional) **Google Gemini** API key for AI event generation

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd spot

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env.local
# Edit .env.local with your actual keys

# 4. Start the Convex development server (in a separate terminal)
npx convex dev

# 5. Start the Next.js development server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# ─── Convex ────────────────────────────────────────────────────────
CONVEX_DEPLOYMENT=dev:<your-deployment-slug>
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment-slug>.convex.cloud
CONVEX_ADMIN_KEY=<your-convex-admin-key>       # Required for manual scraping

# ─── Clerk ─────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-domain>.clerk.accounts.dev

# ─── Optional Integrations ─────────────────────────────────────────
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=<your-unsplash-key>    # For image picker
GEMINI_API_KEY=<your-gemini-key>                        # For AI event generation
CRON_SECRET=<a-random-secret>                           # Protects /api/cron/scrape
```

> ⚠️ **Never commit `.env.local` to source control.** It is already listed in `.gitignore`.

---

## 📁 Project Structure

```
spot/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout (sign-in, sign-up)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (main)/                   # Protected app pages
│   │   ├── create-event/         # Event creation wizard
│   │   ├── dashboard/            # Organizer/admin dashboard
│   │   ├── my-events/            # User's created events
│   │   └── my-tickets/           # User's registrations
│   ├── (public)/                 # Public-facing pages
│   │   ├── events/[slug]/        # Event detail page
│   │   ├── explore/              # Discover events
│   │   └── sydney/               # Sydney scraped events listing
│   ├── api/
│   │   ├── cron/scrape/          # Cron endpoint
│   │   ├── generate-event/       # Gemini AI endpoint
│   │   └── image/                # Image proxy endpoint
│   ├── ConvexClientProvider.jsx  # Convex React provider (legacy)
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout (Clerk + Convex + Theme)
│   └── page.jsx                  # Landing page
│
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui primitives (Button, Badge, etc.)
│   ├── header.jsx                # Site header with nav + search
│   ├── footer.jsx                # Site footer
│   ├── event-card.jsx            # Card for user-created events
│   ├── scraped-event-card.jsx    # Card for scraped Sydney events
│   ├── onboarding-modal.jsx      # 2-step user onboarding wizard
│   ├── search-location-bar.jsx   # Combined search + location filter
│   ├── upgrade-modal.jsx         # Pro plan upsell modal
│   ├── unsplash-image-picker.jsx # Unsplash integration for cover images
│   ├── demo-login-button.jsx     # Quick demo authentication
│   ├── theme-provider.jsx        # next-themes dark mode wrapper
│   └── convex-client-provider.jsx
│
├── convex/                       # Convex backend (serverless DB + functions)
│   ├── schema.js                 # Full database schema definition
│   ├── auth.config.js            # Clerk JWT configuration for Convex
│   ├── users.js                  # User store, getCurrentUser, onboarding
│   ├── events.js                 # Create, get, delete user events
│   ├── registrations.js          # Register, check-in, cancel, QR scan
│   ├── scrapedEvents.js          # Upsert, list, import scraped events
│   ├── explore.js                # Featured, popular, category queries
│   ├── dashboard.js              # Per-event organizer analytics
│   ├── search.js                 # Full-text search helpers
│   └── seed.js                   # Database seed script
│
├── lib/
│   ├── scrape/
│   │   ├── sydney.mjs            # Core scraping logic for 4 Sydney sources
│   │   └── utils.mjs             # Shared scraping utilities
│   ├── data.js                   # Static data (categories, etc.)
│   ├── location-utils.js         # Location formatting helpers
│   └── utils.js                  # `cn()` className utility
│
├── hooks/                        # Custom React hooks
├── scripts/
│   └── scrape-sydney.mjs         # CLI entry point for manual scraping
├── public/                       # Static assets (logo, hero image)
├── middleware.js                 # Clerk auth middleware (route protection)
├── next.config.mjs               # Next.js configuration
├── vercel.json                   # Vercel cron schedule definition
├── components.json               # shadcn/ui configuration
└── package.json
```

---

## ☁️ Deployment

The project is deployed on **Vercel** with Convex as the backend.

### Vercel Setup

1. Import your repository in the Vercel dashboard.
2. Set all **Environment Variables** listed above in the Vercel project settings.
3. Deploy — Vercel will run `next build` automatically.

### Cron Job

The scraper is configured to run daily at **03:00 UTC** via Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 3 * * *"
    }
  ]
}
```

> **Note:** The Vercel Hobby plan limits cron jobs to once per day.

### Convex Setup

```bash
# Deploy Convex functions to production
npx convex deploy
```

Set `CONVEX_DEPLOY_KEY` in Vercel environment variables for CI/CD auto-deployment.

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to your branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

Please follow the existing code style and ensure your changes don't break existing functionality.

---

## 📄 License

This project is for educational/demonstration purposes.

---

<div align="center">

Built with ❤️ by **Harsh Mehta**

**[Live Demo](https://betherefinal-4fuywufii-harsh-mehtas-projects-64ee88d3.vercel.app/)** · **[Report an Issue](../../issues)**

</div>
