import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { scrapeSydneySources } from "../lib/scrape/sydney.mjs";

dotenv.config({ path: ".env.local" });

async function run() {
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
    const adminKey = process.env.CONVEX_ADMIN_KEY;
    if (!convexUrl) {
        throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
    }
    if (!adminKey) {
        throw new Error("Missing CONVEX_ADMIN_KEY");
    }

    const client = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(adminKey);

    const { events, runStartedAt } = await scrapeSydneySources();
    if (events.length === 0) {
        console.log("No events scraped.");
        return;
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

    console.log(`Scraped ${events.length} events.`);
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
