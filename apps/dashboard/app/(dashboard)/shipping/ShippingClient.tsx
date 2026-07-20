"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@repo/ui/components/ui/sheet";
import {
    IconTruck,
    IconCopy,
    IconClipboardCheck,
    IconRefresh,
    IconEye,
    IconCheck,
    IconClock,
    IconX,
    IconInfoCircle
} from "@tabler/icons-react";
import { getShipmentTracking } from "@/lib/api";

type Consignment = {
    id: string;
    order: string;
    shop: string;
    provider: string;
    provider_display: string;
    external_consignment_id: string;
    tracking_code: string;
    status: string;
    status_display: string;
    created_at: string;
    updated_at: string;
};

type TrackingEvent = {
    time: string;
    status: string;
    message: string;
};

export function ShippingClient({
    shopId,
    initialConsignments,
}: {
    shopId: string;
    initialConsignments: Consignment[];
}) {
    const [consignments] = useState<Consignment[]>(initialConsignments);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Live Tracking Overlay
    const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingData, setTrackingData] = useState<any | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        toast.success("Tracking code copied to clipboard.");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleFetchTracking = async (consignment: Consignment) => {
        setSelectedConsignment(consignment);
        setTrackingLoading(true);
        setTrackingData(null);

        const res = await getShipmentTracking(shopId, consignment.id);
        setTrackingLoading(false);

        if (res.success) {
            setTrackingData(res.data);
        } else {
            toast.error(res.error || "Failed to fetch live tracking details.");
        }
    };

    const getStatusBadge = (status: string, display: string) => {
        switch (status) {
            case "DELIVERED":
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                        {display}
                    </Badge>
                );
            case "DISPATCHED":
            case "IN_TRANSIT":
                return (
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
                        {display}
                    </Badge>
                );
            case "FAILED":
            case "RTO":
                return (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                        {display}
                    </Badge>
                );
            case "CREATED":
            default:
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">
                        {display}
                    </Badge>
                );
        }
    };

    // Format date string
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    // Safely extract logs from Pathao tracking payloads
    const getTrackingEvents = (data: any): TrackingEvent[] => {
        if (!data) return [];
        // Support standard list structure
        if (Array.isArray(data.events)) return data.events;
        // Pathao API payloads have custom structure
        const payload = data.payload || {};
        const logs = payload.logs || payload.data?.logs;
        if (Array.isArray(logs)) {
            return logs.map((log: any) => ({
                time: log.updated_at || log.created_at || "",
                status: log.status_slug || log.status || "",
                message: log.note || log.status || "Status updated",
            }));
        }
        return [];
    };

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
                    <p className="text-muted-foreground mt-1">
                        Book courier services, print consignments, and monitor real-time delivery status.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Consignments</CardTitle>
                    <CardDescription>A complete log of all shipments registered to couriers.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {consignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
                            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                                <IconTruck className="size-6" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="font-semibold text-foreground">No Shipments Found</h3>
                                <p className="text-sm">You haven&apos;t registered any consignments with couriers yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tracking Code</TableHead>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Courier</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consignments.map((consignment) => (
                                        <TableRow key={consignment.id}>
                                            <TableCell className="font-mono text-xs max-w-[150px] truncate">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{consignment.tracking_code}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-5 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleCopy(consignment.tracking_code)}
                                                    >
                                                        {copiedId === consignment.tracking_code ? (
                                                            <IconClipboardCheck className="size-3 text-emerald-500" />
                                                        ) : (
                                                            <IconCopy className="size-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/orders/${consignment.order}`}
                                                    className="font-medium text-primary hover:underline text-sm"
                                                >
                                                    View Order
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                                {consignment.provider_display}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(consignment.status, consignment.status_display)}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(consignment.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleFetchTracking(consignment)}
                                                >
                                                    <IconEye className="size-4 mr-1.5" />
                                                    Track Live
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Live Tracking Drawer */}
            <Sheet open={!!selectedConsignment} onOpenChange={(open) => !open && setSelectedConsignment(null)}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader className="pb-6 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <IconTruck className="size-5 text-primary animate-pulse" />
                            Live Consignment Track
                        </SheetTitle>
                        <SheetDescription>
                            Real-time transit information for tracking code:{" "}
                            <span className="font-mono font-medium text-foreground">{selectedConsignment?.tracking_code}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {trackingLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-4 h-[300px]">
                            <IconRefresh className="size-8 animate-spin text-primary" />
                            <p className="text-sm">Fetching live delivery status from courier API...</p>
                        </div>
                    ) : (
                        <div className="pt-6 space-y-6">
                            {trackingData && (
                                <div className="p-4 rounded-lg bg-muted/40 border flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Provider Status:</span>
                                        <span className="font-semibold text-primary">{trackingData.status || selectedConsignment?.status_display}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Tracking ID:</span>
                                        <span className="font-mono text-xs">{trackingData.tracking_code}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-1.5">
                                    <IconInfoCircle className="size-4" /> Transit History
                                </h4>

                                {getTrackingEvents(trackingData).length === 0 ? (
                                    <div className="relative pl-6 border-l border-muted py-2 space-y-1">
                                        <div className="absolute -left-1.5 top-2.5 size-3 rounded-full bg-primary" />
                                        <p className="text-sm font-medium">{selectedConsignment?.status_display}</p>
                                        <p className="text-xs text-muted-foreground">Shipment booked with {selectedConsignment?.provider_display}.</p>
                                        <p className="text-[10px] text-muted-foreground">{selectedConsignment && formatDate(selectedConsignment.created_at)}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                                        {getTrackingEvents(trackingData).map((event, idx) => (
                                            <div key={idx} className="flex gap-4 relative">
                                                <div className={`flex size-6 items-center justify-center rounded-full border bg-background z-10 ${idx === 0 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}>
                                                    {idx === 0 ? <IconClock className="size-3.5" /> : <IconCheck className="size-3.5" />}
                                                </div>
                                                <div className="flex flex-col gap-1 pt-0.5 max-w-[280px]">
                                                    <span className={`text-sm font-medium leading-none ${idx === 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                        {event.status.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{event.message}</span>
                                                    <span className="text-[10px] text-muted-foreground/60">{formatDate(event.time)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
