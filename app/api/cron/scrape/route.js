import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { scrapeSydneySources } from "@/lib/scrape/sydney.mjs";

function isAuthorized(request) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true;
    const authHeader = request.headers.get("authorization") || "";
    return authHeader === `Bearer ${secret}`;
}

export async function GET(request) {
    if (!isAuthorized(request)) {
        return new Response("Unauthorized", { status: 401 });
    }

    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
    const adminKey = process.env.CONVEX_ADMIN_KEY;
    if (!convexUrl || !adminKey) {
        return new Response("Missing Convex config", { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(adminKey);

    const { events, runStartedAt } = await scrapeSydneySources();
    if (events.length === 0) {
        return new Response("No events scraped", { status: 200 });
    }

    await client.mutation(api.scrapedEvents.upsertScrapedEvents, {
        events,
        runStartedAt,
    });

    const sources = [
        "Eventbrite",
        "Meetup",
        "Time Out Sydney",
        "What's On Sydney",
    ];

    for (const sourceName of sources) {
        await client.mutation(api.scrapedEvents.markInactiveForSource, {
            sourceName,
            runStartedAt,
        });
    }

    await client.mutation(api.scrapedEvents.createScrapeRun, {
        startedAt: runStartedAt,
        finishedAt: Date.now(),
        total: events.length,
        sources,
    });

    return new Response(`Scraped ${events.length} events`, { status: 200 });
}
