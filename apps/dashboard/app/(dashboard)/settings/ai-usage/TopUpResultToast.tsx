"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export type TopUpResult =
    | { status: "success" }
    | { status: "error"; message?: string }
    | { status: "cancelled" }
    | null;

export function TopUpResultToast({ result }: { result: TopUpResult }) {
    const router = useRouter();
    const pathname = usePathname();
    const handledResult = useRef(false);

    useEffect(() => {
        if (!result || handledResult.current) return;
        handledResult.current = true;

        if (result.status === "success") {
            toast.success("Credits added to your balance.");
        } else if (result.status === "cancelled") {
            toast.info("Payment cancelled. No credits were purchased.");
        } else {
            toast.error(result.message || "Payment failed. Please try again.");
        }

        // Strip the bKash callback params so a refresh doesn't re-toast.
        router.replace(pathname);
    }, [result, router, pathname]);

    return null;
}
