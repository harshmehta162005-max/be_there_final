import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getEventDashboard = query({
    args: {
        eventId: v.id("events"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);
        if (!user) {
            throw new Error("Authentication required to access event dashboard");
        }
        const event = await ctx.db.get(args.eventId);
        if (!event) {
            throw new Error("Event not found");
        }
        if (event.organizerId !== user._id) {
            throw new Error("You do not have permission to access this event dashboard");
        }

        const registrations = await ctx.db.query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .order("desc")
            .collect();

        const totalRegistrations = registrations.filter(
            (reg) => reg.status === "confirmed"
        ).length;

        const checkedInCount = registrations.filter(
            (reg) => reg.status === "confirmed" && reg.checkedIn === true
        ).length;

        const pendingCount = totalRegistrations - checkedInCount;

        let totalRevenue = 0;
        if (event.ticketType === "paid" && event.ticketPrice) {
            totalRevenue = checkedInCount * event.ticketPrice;
        }
        const checkedInRate =
            totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0;

        const now=Date.now();
        const timeUntilEvent=event.startDate-now;
        const hoursUntilEvent=Math.max(0,Math.floor(timeUntilEvent/(1000*60*60)));

        const today=new Date().setHours(0,0,0,0);
        const startDay=new Date(event.startDate).setHours(0,0,0,0);
        const endDay=new Date(event.endDate).setHours(0,0,0,0);
        const isEventToday=startDay<=today && today<=endDay;
        const isEventPast=event.endDate<now;

        return {
            event,
            stats: {
                totalRegistrations,
                checkedInCount,
                pendingCount,
                capacity: event.capacity,
                checkedInRate,
                totalRevenue,
                hoursUntilEvent,
                isEventToday,
                isEventPast,
            },
        };
    },
});