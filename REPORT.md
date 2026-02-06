# BeThere — Sydney Events Radar  
**Assignment Report (1–2 pages)**  
**Student:** Harsh Mehta  
**Project:** Event Scraping + Listing + Dashboard (Sydney)  
**Stack:** Next.js + Convex + Clerk + Node.js

## 1. Objective  
Build a web platform that automatically scrapes public events in **Sydney, Australia**, stores them in a database, and displays them in a minimal, user‑friendly UI. The system must detect new, updated, and inactive events, allow users to get tickets (email + consent), and provide an authenticated admin dashboard with import workflow.

## 2. System Architecture  
**Frontend:** Next.js App Router, Tailwind CSS  
**Backend + DB:** Convex (serverless database + functions)  
**Auth:** Clerk (Google OAuth)  
**Scraping:** Node.js + Cheerio + JSON‑LD + OpenGraph parsing  
**Deployment:** Vercel

## 3. Scraping Pipeline (Sydney)  
**Sources used**
- Eventbrite (Sydney)
- Meetup (Sydney)
- Time Out Sydney
- What’s On Sydney

**Scrape flow**
1. A scheduled cron (Vercel) triggers `/api/cron/scrape`.
2. `scripts/scrape-sydney.mjs` runs scrapers for each site.
3. Each event is normalized and saved to Convex.

**Stored Fields**
- Title  
- Date & time  
- Venue + address  
- City + country  
- Description / summary  
- Category / tags (when available)  
- Image / poster URL  
- Source name + original URL  
- `lastScrapedAt`, `lastSeenAt`  
- Status tags: `new`, `updated`, `inactive`, `imported`

**Auto‑update logic**
- **New** events inserted with status `new`
- **Updated** events detected by content hash difference
- **Inactive** events marked when no longer seen for a grace period
- **Imported** events tagged after dashboard action

## 4. Event Listing Website  
**Public page:** `/sydney`  

Each event card shows:
- Event name  
- Date & time  
- Location  
- Summary  
- Source  
- “GET TICKETS” CTA  

**GET TICKETS Flow**
- User enters email + opt‑in consent  
- Data saved in Convex `ticketLeads` table  
- User redirected to original event URL

## 5. Admin Dashboard  
**Protected route:** `/dashboard` (Clerk auth required)  

Features:
- City filter (default Sydney, scalable)  
- Keyword search  
- Date range filter  
- Table list view  
- Preview panel (full details)  
- “Import to platform” action  

Import action stores:
- `importedAt`  
- `importedBy`  
- optional `importNotes`  
- updates event status to `imported`

## 6. Status Tag Logic  
Events display tags:
- `new` — first seen  
- `updated` — event details changed  
- `inactive` — removed/expired  
- `imported` — imported by admin  

This supports the required pipeline:  
**scrape → store → display → review → import → tag update**

## 7. Authentication (Google OAuth)  
Clerk provides Google sign‑in.  
Only logged‑in users can access:
- `/dashboard`
- `/my-events`
- `/create-event`
- `/my-tickets`

## 8. Deployment  
Hosted on Vercel with environment variables set for Convex + Clerk.  
Cron runs daily (Hobby plan limitation).  
Manual scraping available via `npm run scrape:sydney`.

## 9. Conclusion  
All mandatory requirements from Assignment 1 are satisfied:  
- Automated multi‑source scraping for Sydney  
- Persistent DB storage with status tagging  
- Clean listing UI + ticket flow  
- Auth + admin dashboard + import logic  

The system demonstrates a full end‑to‑end pipeline and working production deployment.
