"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@repo/ui/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select";
import { IconSearch, IconLoader2 } from "@tabler/icons-react";

const STATUS_OPTIONS = [
    { value: "all", label: "All statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "AWAITING_PAYMENT", label: "Awaiting Payment" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "IN_TRANSIT", label: "In Transit" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
    { value: "RTO_RETURNED", label: "RTO Returned" },
    { value: "ON_HOLD", label: "On Hold" },
];

export function OrdersToolbar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const status = searchParams.get("status") ?? "all";
    const isFirstRender = useRef(true);

    const applyParams = (next: { search?: string; status?: string }) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next.search !== undefined) {
            if (next.search.trim()) params.set("search", next.search.trim());
            else params.delete("search");
        }
        if (next.status !== undefined) {
            if (next.status && next.status !== "all") params.set("status", next.status);
            else params.delete("status");
        }
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    // Debounce search input into the URL.
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            if (search !== (searchParams.get("search") ?? "")) {
                applyParams({ search });
            }
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder="Search by customer name or phone..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {isPending && (
                    <IconLoader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
            </div>
            <Select value={status} onValueChange={(value) => applyParams({ status: value })}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
