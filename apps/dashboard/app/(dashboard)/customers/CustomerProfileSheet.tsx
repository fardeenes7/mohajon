"use client";

import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@repo/ui/components/ui/sheet";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/avatar";
import {
    IconBrandFacebook,
    IconShieldCheck,
    IconAlertTriangle,
    IconMapPin,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { getCustomerProfile } from "@/lib/api";
import { ReportCustomerDialog } from "./ReportCustomerDialog";
import { riskBadgeVariant, type CustomerProfile } from "./types";

export function CustomerProfileSheet({
    shopId,
    userId,
    open,
    onOpenChange,
}: {
    shopId: string;
    userId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);

    useEffect(() => {
        if (!open || !userId) return;
        let active = true;
        setLoading(true);
        setProfile(null);
        getCustomerProfile(shopId, userId).then((res) => {
            if (!active) return;
            setLoading(false);
            if (res.success) {
                setProfile(res.data as CustomerProfile);
            } else {
                toast.error(res.error || "Failed to load customer profile.");
                onOpenChange(false);
            }
        });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, userId, shopId]);

    const phone = profile?.basic_info.primary_phone ?? "";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Customer Profile</SheetTitle>
                    <SheetDescription>
                        Order history and fraud signals for this buyer.
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="space-y-4 px-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : profile ? (
                    <div className="space-y-6 px-4 pb-6">
                        {/* Identity */}
                        <div className="flex items-center gap-3">
                            <Avatar className="size-12">
                                <AvatarFallback>
                                    {(phone || "?").slice(-2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium">{phone || "Unknown phone"}</span>
                                <span className="text-xs text-muted-foreground">
                                    Customer since{" "}
                                    {new Date(profile.basic_info.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                                {profile.fraud_info.is_verified && (
                                    <Badge variant="success" className="gap-1">
                                        <IconShieldCheck className="size-3" />
                                        Verified
                                    </Badge>
                                )}
                                {profile.basic_info.facebook_linked && (
                                    <Badge variant="info" className="gap-1">
                                        <IconBrandFacebook className="size-3" />
                                        FB
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Risk summary */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <IconAlertTriangle className="size-4" />
                                Fraud Risk
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Phone Risk
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-lg font-bold">
                                            {profile.fraud_info.phone_score}
                                        </span>
                                        <Badge
                                            variant={riskBadgeVariant(
                                                profile.fraud_info.phone_risk_level
                                            )}
                                        >
                                            {profile.fraud_info.phone_risk_level}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">User Risk</div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-lg font-bold">
                                            {profile.fraud_info.user_score}
                                        </span>
                                        <Badge
                                            variant={riskBadgeVariant(
                                                profile.fraud_info.user_risk_level
                                            )}
                                        >
                                            {profile.fraud_info.user_risk_level}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                Trust score: {profile.fraud_info.trust_score}
                            </div>
                        </div>

                        <Separator />

                        {/* Order stats */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Order History</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border p-3 text-center">
                                    <div className="text-lg font-bold">
                                        {profile.order_stats.total}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <div className="text-lg font-bold text-green-600">
                                        {profile.order_stats.delivered}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Delivered</div>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                    <div className="text-lg font-bold text-destructive">
                                        {profile.order_stats.cancelled}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Cancelled</div>
                                </div>
                            </div>
                        </div>

                        {/* Addresses */}
                        {profile.addresses.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <IconMapPin className="size-4" />
                                        Addresses
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                className="rounded-lg border p-3 text-sm"
                                            >
                                                <div className="font-medium">
                                                    {addr.contact_name}{" "}
                                                    <span className="text-muted-foreground font-normal">
                                                        · {addr.contact_phone}
                                                    </span>
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {[addr.street, addr.city, addr.postal_code]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Recent fraud events */}
                        {profile.recent_fraud_events.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-3">
                                        Recent Fraud Events
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.recent_fraud_events.map((event) => (
                                            <div
                                                key={event.id}
                                                className="flex items-center justify-between rounded-lg border p-2 text-sm"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {event.event_type}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            event.created_at
                                                        ).toLocaleDateString()}{" "}
                                                        · {event.confidence_level}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant={
                                                        event.score_impact > 0
                                                            ? "destructive"
                                                            : "success"
                                                    }
                                                >
                                                    {event.score_impact > 0 ? "+" : ""}
                                                    {event.score_impact}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />

                        <ReportCustomerDialog
                            shopId={shopId}
                            phoneNumber={phone}
                            trigger={
                                <Button variant="destructive" className="w-full gap-2">
                                    <IconAlertTriangle className="size-4" />
                                    Report Customer
                                </Button>
                            }
                        />
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
