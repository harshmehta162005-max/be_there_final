"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, ExternalLink, MapPin } from "lucide-react";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ScrapedEventCard({ event }) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [consent, setConsent] = useState(false);
    const [imageError, setImageError] = useState(false);

    const { mutate: createLead, isLoading } = useConvexMutation(
        api.scrapedEvents.createTicketLead
    );

    const handleGetTickets = () => {
        setIsOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Please enter your email");
            return;
        }

        try {
            const result = await createLead({
                scrapedEventId: event._id,
                email,
                consent,
            });
            toast.success("Thanks! Redirecting to tickets...");
            setIsOpen(false);
            setEmail("");
            setConsent(false);
            window.location.href = result.redirectUrl;
        } catch (error) {
            toast.error(error.message || "Failed to save your details");
        }
    };

    const rawImageUrl = event.imageUrl || "";
    const isProxyable =
        rawImageUrl.startsWith("http://") || rawImageUrl.startsWith("https://");
    const imageUrl = isProxyable
        ? `/api/image?url=${encodeURIComponent(rawImageUrl)}`
        : "/beThere_hero_4.png";

    return (
        <>
            <Card className="overflow-hidden group pt-0">
                <div className="relative h-48 overflow-hidden">
                    <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-full"
                    >
                        {!imageError ? (
                            <img
                                src={imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={() => setImageError(true)}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <span className="text-sm text-muted-foreground">
                                    No image
                                </span>
                            </div>
                        )}
                    </a>
                    <div className="absolute top-3 right-3">
                        <Badge variant="secondary">{event.sourceName}</Badge>
                    </div>
                </div>

                <CardContent className="space-y-3">
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-2">
                            {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                        </p>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(event.startDate, "PPP, h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">
                                {event.venueName || "Sydney"}{" "}
                                {event.address ? `• ${event.address}` : ""}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                        <Button onClick={handleGetTickets} className="flex-1">
                            GET TICKETS
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            asChild
                            className="shrink-0"
                        >
                            <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Get Tickets</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <label className="flex items-start gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1"
                            />
                            I want updates about similar events (optional)
                        </label>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Continue to Tickets"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
