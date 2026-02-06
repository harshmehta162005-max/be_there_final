import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        tokenIdentifier: v.string(),
        imageUrl: v.optional(v.string()),

        hasCompletedOnboarding: v.boolean(),
        location: v.optional(v.object({
            city: v.string(),
            country: v.string(),
            state: v.optional(v.string()),
        })),
        interests: v.optional(v.array(v.string())),
        freeEventsCreated: v.number(),

        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_token", ["tokenIdentifier"]),
    events: defineTable({
        title: v.string(),
        description: v.string(),
        slug: v.string(),

        organizerId: v.id("users"),
        organizerName: v.string(),

        category: v.string(),
        tags: v.array(v.string()),

        startDate: v.number(),
        endDate: v.number(),
        timezone: v.string(),

        locationType: v.union(v.literal("online"), v.literal("physical")),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),

        capacity: v.number(),
        ticketType: v.union(v.literal("free"), v.literal("paid")),
        ticketPrice: v.optional(v.number()),
        registrationCount: v.number(),

        coverImage: v.optional(v.string()),
        themeColor: v.optional(v.string()),

        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_organizer", ["organizerId"])
        .index("by_slug", ["slug"])
        .index("by_category", ["category"])
        .index("by_start_date", ["startDate"])
        .searchIndex("search_title", { searchField: "title" }),

    registrations: defineTable({
            eventId: v.id("events"),
            userId: v.id("users"),
            
            attendeeName: v.string(),
            attendeeEmail: v.string(),

            qrCode: v.string(),

            checkedIn: v.boolean(),
            checkedInAt: v.optional(v.number()),

            status: v.union(v.literal("confirmed"), v.literal("cancelled")),

            registeredAt: v.number(),
        }).index("by_user", ["userId"])
        .index("by_event", ["eventId"])
        .index("by_event_user", ["eventId", "userId"])
        .index("by_qr_code", ["qrCode"])

    ,
    scrapedEvents: defineTable({
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

        status: v.string(),
        statusTags: v.array(v.string()),

        contentHash: v.string(),
        lastScrapedAt: v.number(),
        lastSeenAt: v.number(),

        importedAt: v.optional(v.number()),
        importedBy: v.optional(v.id("users")),
        importNotes: v.optional(v.string()),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_dedupe", ["dedupeKey"])
        .index("by_city", ["city"])
        .index("by_source", ["sourceName"])
        .index("by_status", ["status"])
        .index("by_start_date", ["startDate"])
        .searchIndex("search_title", { searchField: "title" }),

    ticketLeads: defineTable({
        scrapedEventId: v.id("scrapedEvents"),
        email: v.string(),
        consent: v.boolean(),
        sourceUrl: v.string(),
        createdAt: v.number(),
    }).index("by_event", ["scrapedEventId"]),

    imports: defineTable({
        scrapedEventId: v.id("scrapedEvents"),
        importedAt: v.number(),
        importedBy: v.id("users"),
        importNotes: v.optional(v.string()),
    }).index("by_event", ["scrapedEventId"]),

    scrapeRuns: defineTable({
        startedAt: v.number(),
        finishedAt: v.number(),
        total: v.number(),
        sources: v.array(v.string()),
    }).index("by_started", ["startedAt"]),

});
