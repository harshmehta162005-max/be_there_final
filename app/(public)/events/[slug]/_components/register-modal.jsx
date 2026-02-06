"use client";

import { useState } from "react";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterModal({ event, isOpen, onClose }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const { mutate: registerForEvent, isLoading } = useConvexMutation(
        api.registrations.registerForEvent
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            toast.error("Please enter your name and email");
            return;
        }

        try {
            await registerForEvent({
                eventId: event._id,
                attendeeName: name.trim(),
                attendeeEmail: email.trim(),
            });
            toast.success("You’re registered!");
            setName("");
            setEmail("");
            onClose();
        } catch (error) {
            toast.error(error.message || "Failed to register");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Register for Event</DialogTitle>
                    <DialogDescription>
                        Enter your details to reserve your spot.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm">Full Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                        />
                    </div>

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

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Registering..." : "Confirm Registration"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
