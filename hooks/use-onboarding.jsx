"use client";
import { usePathname, useRouter } from "next/navigation";
import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";
import { set } from "date-fns";
import { useEffect, useState } from "react";

const ATTENDEE_PAGES = ["/explore", "/events", "/my-tickets"];

export function useOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { data: currentUser, isLoading } = useConvexQuery(api.users.getCurrentUser);
    useEffect(() => {
        if (!isLoading && currentUser) {
            return;
        }
        if (!currentUser?.hasCompletedOnboarding) {
            const requiresOnboarding = ATTENDEE_PAGES.some(page => pathname.startsWith(page));
            if (requiresOnboarding) {
                setShowOnboarding(true);
            }
        }
    }, [isLoading, currentUser, pathname]);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        router.refresh();
    };
    const handleOnboardingSkip = () => {
        setShowOnboarding(false);
        router.push("/");
    };
    return {
        showOnboarding,
        handleOnboardingComplete,
        handleOnboardingSkip,
        setShowOnboarding,
        needsOnboarding: currentUser && !currentUser.hasCompletedOnboarding
    };
        

}
