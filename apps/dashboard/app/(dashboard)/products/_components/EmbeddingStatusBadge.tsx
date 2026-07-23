import React from "react";
import { Badge } from "@repo/ui/components/ui/badge";
import { IconSparkles, IconAlertTriangle, IconClock, IconBan } from "@tabler/icons-react";

interface EmbeddingStatusBadgeProps {
    status?: "PENDING" | "CREATED" | "SKIPPED" | "FAILED" | string;
    showLabel?: boolean;
}

export function EmbeddingStatusBadge({ status = "PENDING", showLabel = true }: EmbeddingStatusBadgeProps) {
    switch (status) {
        case "CREATED":
            return (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium text-xs gap-1.5 py-0.5">
                    <IconSparkles className="size-3.5 text-emerald-500" />
                    {showLabel && <span>AI Embedded</span>}
                </Badge>
            );
        case "SKIPPED":
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium text-xs gap-1.5 py-0.5">
                    <IconBan className="size-3.5 text-amber-500" />
                    {showLabel && <span>AI Skipped (Free)</span>}
                </Badge>
            );
        case "FAILED":
            return (
                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-medium text-xs gap-1.5 py-0.5">
                    <IconAlertTriangle className="size-3.5 text-rose-500" />
                    {showLabel && <span>AI Failed</span>}
                </Badge>
            );
        case "PENDING":
        default:
            return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium text-xs gap-1.5 py-0.5">
                    <IconClock className="size-3.5 text-blue-500 animate-spin" />
                    {showLabel && <span>AI Pending</span>}
                </Badge>
            );
    }
}
