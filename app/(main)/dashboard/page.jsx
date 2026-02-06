"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = ["all", "new", "updated", "inactive", "imported"];

export default function DashboardPage() {
    const [city, setCity] = useState("Sydney");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [importNotes, setImportNotes] = useState("");

    const startDateMs = startDate ? new Date(startDate).getTime() : undefined;
    const endDateMs = endDate ? new Date(endDate).getTime() : undefined;

    const { data: events, isLoading } = useConvexQuery(
        api.scrapedEvents.getDashboardEvents,
        {
            city,
            query: query.trim() || undefined,
            startDate: startDateMs,
            endDate: endDateMs,
            status: status === "all" ? undefined : status,
            limit: 200,
        }
    );
    const { data: scrapeStatus } = useConvexQuery(
        api.scrapedEvents.getScrapeStatus
    );

    const selectedEvent = useMemo(
        () => events?.find((event) => event._id === selectedEventId) || events?.[0],
        [events, selectedEventId]
    );

    const { mutate: importEvent, isLoading: importing } = useConvexMutation(
        api.scrapedEvents.importScrapedEvent
    );

    const handleImport = async (eventId) => {
        try {
            await importEvent({ scrapedEventId: eventId, importNotes });
            toast.success("Event imported");
        } catch (error) {
            toast.error(error.message || "Failed to import");
        }
    };

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
                <div className="mb-6">
                    <h1 className="text-4xl font-bold mb-2">Scraped Events Dashboard</h1>
                    <p className="text-muted-foreground">
                        Review, filter, and import events into the platform.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <Card className="py-3">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total Events</p>
                            <p className="text-2xl font-bold">
                                {scrapeStatus?.counts?.total ?? 0}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="py-3">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">New</p>
                            <p className="text-2xl font-bold">
                                {scrapeStatus?.counts?.new ?? 0}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="py-3">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">Updated</p>
                            <p className="text-2xl font-bold">
                                {scrapeStatus?.counts?.updated ?? 0}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="py-3">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">Inactive</p>
                            <p className="text-2xl font-bold">
                                {scrapeStatus?.counts?.inactive ?? 0}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="py-3">
                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">Last Run</p>
                            <p className="text-sm font-semibold">
                                {scrapeStatus?.latestRun?.finishedAt
                                    ? `${scrapeStatus.minutesSinceLastRun}m ago`
                                    : "No runs yet"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {scrapeStatus?.latestRun?.total ?? 0} events
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-6">
                        <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                        />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Keyword search"
                        />
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
                            className="h-9 rounded-md border bg-transparent px-3 text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                    <div className="space-y-3">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_140px] gap-3 px-3 text-xs uppercase text-muted-foreground">
                            <span>Event</span>
                            <span>Date</span>
                            <span>Status</span>
                            <span>Actions</span>
                        </div>

                        <div className="space-y-2">
                            {events?.map((event) => (
                                <Card
                                    key={event._id}
                                    className={`py-3 cursor-pointer ${
                                        selectedEvent?._id === event._id
                                            ? "border-purple-500/70"
                                            : ""
                                    }`}
                                    onClick={() => setSelectedEventId(event._id)}
                                >
                                    <CardContent className="grid grid-cols-[1.5fr_1fr_1fr_140px] gap-3 items-center">
                                        <div>
                                            <p className="font-semibold">{event.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {event.venueName || "Sydney"} • {event.sourceName}
                                            </p>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {format(event.startDate, "PPP")}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {event.statusTags?.map((tag) => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleImport(event._id);
                                            }}
                                            disabled={importing || event.statusTags?.includes("imported")}
                                        >
                                            {event.statusTags?.includes("imported")
                                                ? "Imported"
                                                : "Import"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div>
                        {selectedEvent ? (
                            <Card className="sticky top-24">
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            {selectedEvent.title}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedEvent.venueName || "Sydney"} •{" "}
                                            {selectedEvent.sourceName}
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>{format(selectedEvent.startDate, "PPP, h:mm a")}</p>
                                        <p>{selectedEvent.address}</p>
                                        <p>{selectedEvent.sourceUrl}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">Description</h3>
                                        <div className="prose prose-invert max-w-none text-muted-foreground max-h-56 overflow-y-auto leading-relaxed">
                                            <ReactMarkdown>
                                                {selectedEvent.description}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold mb-2">
                                            Import Notes
                                        </h3>
                                        <Textarea
                                            value={importNotes}
                                            onChange={(e) => setImportNotes(e.target.value)}
                                            placeholder="Optional notes about this import..."
                                            rows={4}
                                        />
                                    </div>

                                    <Button
                                        onClick={() => handleImport(selectedEvent._id)}
                                        disabled={
                                            importing ||
                                            selectedEvent.statusTags?.includes("imported")
                                        }
                                    >
                                        {selectedEvent.statusTags?.includes("imported")
                                            ? "Imported"
                                            : "Import to Platform"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-muted-foreground">Select an event.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
