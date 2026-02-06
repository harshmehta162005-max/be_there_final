"use client";

import { useMemo, useState } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Loader2, Search } from "lucide-react";
import ScrapedEventCard from "@/components/scraped-event-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SydneyEventsPage() {
    const { data: events, isLoading } = useConvexQuery(
        api.scrapedEvents.listPublicSydney,
        { limit: 60 }
    );
    const [query, setQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [source, setSource] = useState("all");

    const filteredEvents = useMemo(() => {
        if (!events) return [];
        const q = query.trim().toLowerCase();
        const startMs = startDate ? new Date(startDate).getTime() : null;
        const endMs = endDate ? new Date(endDate).getTime() : null;
        return events.filter((event) => {
            if (source !== "all" && event.sourceName !== source) return false;
            if (startMs && event.startDate < startMs) return false;
            if (endMs && event.startDate > endMs) return false;
            if (!q) return true;
            const haystack = [event.title, event.description, event.venueName]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [events, query, startDate, endDate, source]);

    const sources = useMemo(() => {
        const set = new Set();
        events?.forEach((event) => set.add(event.sourceName));
        return ["all", ...Array.from(set)];
    }, [events]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-3">
                        Sydney, Australia
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        Sydney Events Radar
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Automatically curated events updated throughout the day from top
                        public listings.
                    </p>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_160px] gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search events, venues, keywords"
                            className="pl-10"
                        />
                    </div>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <select
                        className="h-9 rounded-md border bg-background text-foreground px-3 text-sm"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                    >
                        {sources.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                {filteredEvents?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <ScrapedEventCard key={event._id} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground space-y-3">
                        <p>No events match your filters right now.</p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setQuery("");
                                setStartDate("");
                                setEndDate("");
                                setSource("all");
                            }}
                        >
                            Reset filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
