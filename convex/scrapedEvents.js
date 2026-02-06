import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const STATUS = {
    NEW: "new",
    UPDATED: "updated",
    INACTIVE: "inactive",
    IMPORTED: "imported",
};

function mergeStatusTags(existing = [], next) {
    const set = new Set(existing);
    set.add(next);
    return Array.from(set);
}

export const listPublicSydney = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("scrapedEvents")
            .withIndex("by_city", (q) => q.eq("city", "Sydney"))
            .filter((q) => q.gte(q.field("startDate"), now))
            .order("asc")
            .take(args.limit ?? 60);

        return events;
    },
});

export const getDashboardEvents = query({
    args: {
        city: v.optional(v.string()),
        query: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const city = args.city ?? "Sydney";
        const max = args.limit ?? 200;
        const now = Date.now();

        let events = await ctx.db
            .query("scrapedEvents")
            .withIndex("by_city", (q) => q.eq("city", city))
            .order("asc")
            .collect();

        events = events.filter((event) => event.startDate >= now);

        if (args.status) {
            events = events.filter((event) => event.statusTags?.includes(args.status));
        }

        if (args.startDate) {
            events = events.filter((event) => event.startDate >= args.startDate);
        }
        if (args.endDate) {
            events = events.filter((event) => event.startDate <= args.endDate);
        }

        if (args.query && args.query.trim().length > 0) {
            const q = args.query.trim().toLowerCase();
            events = events.filter((event) => {
                const haystack = [
                    event.title,
                    event.description,
                    event.venueName,
                    event.address,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(q);
            });
        }

        return events.slice(0, max);
    },
});

export const getScrapedEventById = query({
    args: { id: v.id("scrapedEvents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const createTicketLead = mutation({
    args: {
        scrapedEventId: v.id("scrapedEvents"),
        email: v.string(),
        consent: v.boolean(),
    },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.scrapedEventId);
        if (!event) {
            throw new Error("Event not found");
        }

        await ctx.db.insert("ticketLeads", {
            scrapedEventId: args.scrapedEventId,
            email: args.email,
            consent: args.consent,
            sourceUrl: event.sourceUrl,
            createdAt: Date.now(),
        });

        return { success: true, redirectUrl: event.sourceUrl };
    },
});

export const importScrapedEvent = mutation({
    args: {
        scrapedEventId: v.id("scrapedEvents"),
        importNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);
        if (!user) {
            throw new Error("Authentication required");
        }

        const event = await ctx.db.get(args.scrapedEventId);
        if (!event) {
            throw new Error("Event not found");
        }

        const now = Date.now();
        await ctx.db.insert("imports", {
            scrapedEventId: args.scrapedEventId,
            importedAt: now,
            importedBy: user._id,
            importNotes: args.importNotes,
        });

        await ctx.db.patch(args.scrapedEventId, {
            status: STATUS.IMPORTED,
            statusTags: mergeStatusTags(event.statusTags, STATUS.IMPORTED),
            importedAt: now,
            importedBy: user._id,
            importNotes: args.importNotes,
            updatedAt: now,
        });

        return { success: true };
    },
});

export const upsertScrapedEvents = mutation({
    args: {
        events: v.array(
            v.object({
                title: v.string(),
                description: v.string(),
                startDate: v.number(),
                endDate: v.optional(v.number()),
                timezone: v.string(),
                venueName: v.optional(v.string()),
                address: v.optional(v.string()),
                city: v.string(),
                country: v.string(),
                category: v.optional(v.string()),
                tags: v.optional(v.array(v.string())),
                imageUrl: v.optional(v.string()),
                sourceName: v.string(),
                sourceUrl: v.string(),
                sourceEventId: v.optional(v.string()),
                dedupeKey: v.string(),
                contentHash: v.string(),
            })
        ),
        runStartedAt: v.number(),
    },
    handler: async (ctx, args) => {
        for (const event of args.events) {
            const existing = await ctx.db
                .query("scrapedEvents")
                .withIndex("by_dedupe", (q) => q.eq("dedupeKey", event.dedupeKey))
                .unique();

            const now = Date.now();
            if (!existing) {
                await ctx.db.insert("scrapedEvents", {
                    ...event,
                    status: STATUS.NEW,
                    statusTags: [STATUS.NEW],
                    lastScrapedAt: now,
                    lastSeenAt: now,
                    createdAt: now,
                    updatedAt: now,
                });
                continue;
            }

            const hasChanged = existing.contentHash !== event.contentHash;
            const baseTags = existing.statusTags.filter(
                (tag) => tag !== STATUS.INACTIVE
            );
            let nextStatus = existing.status;
            if (existing.status === STATUS.INACTIVE) {
                nextStatus = STATUS.UPDATED;
            }
            if (hasChanged) {
                nextStatus = STATUS.UPDATED;
            }
            const nextTags = hasChanged
                ? mergeStatusTags(baseTags, STATUS.UPDATED)
                : baseTags;

            await ctx.db.patch(existing._id, {
                ...event,
                status: nextStatus,
                statusTags: nextTags,
                lastScrapedAt: now,
                lastSeenAt: now,
                updatedAt: now,
            });
        }

        return { success: true, count: args.events.length };
    },
});

export const markInactiveForSource = mutation({
    args: {
        sourceName: v.string(),
        runStartedAt: v.number(),
        graceMs: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const grace = args.graceMs ?? 6 * 60 * 60 * 1000;
        const cutoff = args.runStartedAt - grace;

        const events = await ctx.db
            .query("scrapedEvents")
            .withIndex("by_source", (q) => q.eq("sourceName", args.sourceName))
            .collect();

        for (const event of events) {
            if (event.lastSeenAt < cutoff && !event.statusTags.includes(STATUS.INACTIVE)) {
                await ctx.db.patch(event._id, {
                    status: STATUS.INACTIVE,
                    statusTags: mergeStatusTags(event.statusTags, STATUS.INACTIVE),
                    updatedAt: Date.now(),
                });
            }
        }

        return { success: true };
    },
});

export const createScrapeRun = mutation({
    args: {
        startedAt: v.number(),
        finishedAt: v.number(),
        total: v.number(),
        sources: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("scrapeRuns", {
            startedAt: args.startedAt,
            finishedAt: args.finishedAt,
            total: args.total,
            sources: args.sources,
        });
        return { success: true };
    },
});

export const getScrapeStatus = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const runs = await ctx.db
            .query("scrapeRuns")
            .withIndex("by_started")
            .order("desc")
            .take(1);

        const latestRun = runs[0] ?? null;
        const events = await ctx.db.query("scrapedEvents").collect();
        const counts = {
            total: events.length,
            new: 0,
            updated: 0,
            inactive: 0,
            imported: 0,
        };

        for (const event of events) {
            if (event.statusTags?.includes("new")) counts.new += 1;
            if (event.statusTags?.includes("updated")) counts.updated += 1;
            if (event.statusTags?.includes("inactive")) counts.inactive += 1;
            if (event.statusTags?.includes("imported")) counts.imported += 1;
        }

        const lastScrapeAt = latestRun?.finishedAt ?? null;
        const minutesSinceLastRun = lastScrapeAt
            ? Math.max(0, Math.round((now - lastScrapeAt) / 60000))
            : null;

        return {
            latestRun,
            counts,
            minutesSinceLastRun,
        };
    },
});
