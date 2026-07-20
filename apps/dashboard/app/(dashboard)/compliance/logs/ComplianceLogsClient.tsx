"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { getComplianceLogs } from "@/lib/api";

type LogKind = "orders" | "messages" | "inventory" | "audit";

const TABS: { value: LogKind; label: string; colSpan: number }[] = [
    { value: "orders", label: "Orders", colSpan: 5 },
    { value: "messages", label: "Messages", colSpan: 5 },
    { value: "inventory", label: "Inventory", colSpan: 5 },
    { value: "audit", label: "Audit", colSpan: 5 },
];

function fmtDate(value?: string) {
    return value ? new Date(value).toLocaleString() : "—";
}

function shortId(value?: string | null) {
    if (!value) return "—";
    return String(value).slice(0, 8);
}

/** Map a delivery status to a badge variant. */
function deliveryVariant(status: string) {
    switch (status) {
        case "SENT":
            return "success" as const;
        case "PENDING":
            return "warning" as const;
        case "FAILED":
            return "destructive" as const;
        default:
            return "secondary" as const;
    }
}

export function ComplianceLogsClient({ shopId }: { shopId: string }) {
    const [tab, setTab] = useState<LogKind>("orders");

    return (
        <Tabs value={tab} onValueChange={(v) => setTab(v as LogKind)}>
            <TabsList>
                {TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                        {t.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {TABS.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-4">
                    <LogTable shopId={shopId} kind={t.value} active={tab === t.value} />
                </TabsContent>
            ))}
        </Tabs>
    );
}

function LogTable({ shopId, kind, active }: { shopId: string; kind: LogKind; active: boolean }) {
    const [rows, setRows] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(1);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(
        async (targetPage: number) => {
            setLoading(true);
            setError(null);
            const res = await getComplianceLogs(shopId, kind, targetPage);
            setLoading(false);
            if (res.success) {
                setRows(res.data.results || []);
                setNumPages(res.data.num_pages || 1);
                setCount(res.data.count || 0);
                setPage(targetPage);
            } else {
                setError(res.error || "Failed to load logs.");
            }
        },
        [shopId, kind],
    );

    // Lazy-load: only fetch a tab's data the first time it becomes active.
    useEffect(() => {
        if (active && !loaded) {
            setLoaded(true);
            load(1);
        }
    }, [active, loaded, load]);

    const columns = COLUMNS[kind];

    return (
        <div className="space-y-3">
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((c) => (
                                <TableHead key={c.key} className={c.className}>
                                    {c.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((c) => (
                                        <TableCell key={c.key}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-destructive"
                                >
                                    {error}
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow key={row.id}>
                                    {columns.map((c) => (
                                        <TableCell key={c.key} className={c.className}>
                                            {c.render(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {(numPages > 1 || count > 0) && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{count} record{count !== 1 ? "s" : ""}</span>
                    <div className="flex items-center gap-2">
                        <span>
                            Page {page} of {numPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={loading || page <= 1}
                            onClick={() => load(page - 1)}
                        >
                            <IconChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={loading || page >= numPages}
                            onClick={() => load(page + 1)}
                        >
                            <IconChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface Column {
    key: string;
    label: string;
    className?: string;
    render: (row: any) => ReactNode;
}

const COLUMNS: Record<LogKind, Column[]> = {
    orders: [
        { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
        {
            key: "order_id",
            label: "Order",
            className: "font-mono text-xs",
            render: (r) => shortId(r.order_id),
        },
        {
            key: "transition",
            label: "Transition",
            render: (r) => (
                <span className="flex items-center gap-1.5">
                    <Badge variant="outline">{r.from_status || "—"}</Badge>
                    <IconChevronRight className="size-3 text-muted-foreground" />
                    <Badge variant="secondary">{r.to_status}</Badge>
                </span>
            ),
        },
        { key: "reason", label: "Reason", render: (r) => r.reason || "—" },
        {
            key: "actor_user_id",
            label: "Actor",
            className: "font-mono text-xs",
            render: (r) => shortId(r.actor_user_id),
        },
    ],
    messages: [
        { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
        { key: "channel", label: "Channel", render: (r) => <Badge variant="outline">{r.channel}</Badge> },
        { key: "event_key", label: "Event", render: (r) => r.event_key || "—" },
        { key: "recipient", label: "Recipient", render: (r) => r.recipient || "—" },
        {
            key: "status",
            label: "Status",
            render: (r) => (
                <span className="flex flex-col gap-0.5">
                    <Badge variant={deliveryVariant(r.status)}>{r.status}</Badge>
                    {r.error_message && (
                        <span className="text-xs text-destructive">{r.error_message}</span>
                    )}
                </span>
            ),
        },
    ],
    inventory: [
        { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
        {
            key: "variant_id",
            label: "Variant",
            className: "font-mono text-xs",
            render: (r) => shortId(r.variant_id),
        },
        {
            key: "delta",
            label: "Change",
            className: "font-mono",
            render: (r) => (
                <span className={r.delta < 0 ? "text-destructive" : "text-emerald-600"}>
                    {r.delta > 0 ? `+${r.delta}` : r.delta}
                </span>
            ),
        },
        { key: "reason", label: "Reason", render: (r) => <Badge variant="outline">{r.reason}</Badge> },
        {
            key: "reference_id",
            label: "Reference",
            className: "font-mono text-xs",
            render: (r) => shortId(r.reference_id),
        },
    ],
    audit: [
        { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
        { key: "action", label: "Action", render: (r) => <Badge variant="secondary">{r.action}</Badge> },
        { key: "resource_type", label: "Resource", render: (r) => r.resource_type || "—" },
        {
            key: "resource_id",
            label: "Resource ID",
            className: "font-mono text-xs",
            render: (r) => shortId(r.resource_id),
        },
        { key: "ip_address", label: "IP", className: "font-mono text-xs", render: (r) => r.ip_address || "—" },
    ],
};
