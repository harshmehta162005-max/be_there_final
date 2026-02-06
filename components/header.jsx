"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building, Crown, Plus, Sparkles, Ticket } from "lucide-react";
import { SignInButton, useAuth, UserButton, useUser } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { BarLoader } from "react-spinners";
import { useStoreUser } from "@/hooks/use-store-user";
import { useOnboarding } from "@/hooks/use-onboarding";
import OnboardingModal from "./onboarding-modal";
import SearchLocationBar from "./search-location-bar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import UpgradeModal from "./upgrade-modal";
import { Badge } from "./ui/badge";

export default function Header() {
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const { isLoading } = useStoreUser();
    const { showOnboarding, handleOnboardingComplete, handleOnboardingSkip } =
        useOnboarding();

    const { has } = useAuth();
    const hasPro = has?.({ plan: "pro" });

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl z-20 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <Image
                            src="/BeThere_logo.png"
                            alt="BeThere logo"
                            width={500}
                            height={500}
                            className="h-13 w-auto sm:h-11 lg:h-15"
                            priority
                        />
                        {/* <span className="text-purple-500 text-2xl font-bold">BeThere*</span> */}
                        {hasPro && (
                            <Badge className="hidden sm:inline-flex bg-linear-to-r from-pink-500 to-orange-500 gap-1 text-white ml-1">
                                <Crown className="w-3 h-3" />
                                Pro
                            </Badge>
                        )}
                    </Link>

                    {/* Search & Location - Desktop Only */}
                    <div className="hidden md:flex flex-1 justify-center">
                        <SearchLocationBar />
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 justify-end flex-nowrap overflow-x-auto no-scrollbar">
                        {/* Show Pro badge or Upgrade button */}
                        {!hasPro && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUpgradeModal(true)}
                                className="hidden sm:inline-flex"
                            >
                                Pricing
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className={"mr-1 sm:mr-2 px-2 text-xs sm:text-sm"}
                        >
                            <Link href="/explore">Explore</Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className={"mr-1 sm:mr-2 px-2 text-xs sm:text-sm"}
                        >
                            <Link href="/sydney">Sydney</Link>
                        </Button>

                        <Authenticated>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className={"mr-1 sm:mr-2 px-2 text-xs sm:text-sm"}
                            >
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                            {/* Create Event Button */}
                            <Button size="sm" asChild className="flex gap-2 mr-2 sm:mr-4 px-2">
                                <Link href="/create-event">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Create Event</span>
                                </Link>
                            </Button>

                            {/* User Button */}
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9",
                                    },
                                }}
                            >
                                <UserButton.MenuItems>
                                    <UserButton.Link
                                        label="My Tickets"
                                        labelIcon={<Ticket size={16} />}
                                        href="/my-tickets"
                                    />
                                    <UserButton.Link
                                        label="My Events"
                                        labelIcon={<Building size={16} />}
                                        href="/my-events"
                                    />
                                    <UserButton.Action label="manageAccount" />
                                </UserButton.MenuItems>
                            </UserButton>
                        </Authenticated>

                        <Unauthenticated>
                            <SignInButton mode="modal">
                                <Button size="sm">Sign In</Button>
                            </SignInButton>
                        </Unauthenticated>
                    </div>
                </div>

                {/* Mobile Search & Location - Below Header */}
                <div className="md:hidden border-t px-3 py-3">
                    <SearchLocationBar />
                </div>

                {isLoading && (
                    <div className="absolute bottom-0 left-0 w-full">
                        <BarLoader width={"100%"} color="#a855f7" />
                    </div>
                )}
            </nav>

            {/* Onboarding Modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                onClose={handleOnboardingSkip}
                onComplete={handleOnboardingComplete}
            />

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                trigger="header"
            />
        </>
    );
}
