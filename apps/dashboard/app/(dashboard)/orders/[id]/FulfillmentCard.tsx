"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select";
import {
    IconTruck,
    IconLoader2,
    IconExternalLink,
    IconAlertCircle,
    IconCalendar,
    IconCash,
    IconMapPin
} from "@tabler/icons-react";
import {
    getCourierLocations,
    estimateShippingPrice,
    createShipment,
} from "@/lib/api";

type CourierAccount = {
    provider: string;
    is_active: boolean;
};

type FulfillmentCardProps = {
    shopId: string;
    orderId: string;
    orderStatus: string;
    shippingAddress: string;
    amountToCollect: number;
    initialConsignments: any[];
    courierAccounts: CourierAccount[];
};

export function FulfillmentCard({
    shopId,
    orderId,
    orderStatus,
    shippingAddress,
    amountToCollect,
    initialConsignments,
    courierAccounts,
}: FulfillmentCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const pathaoActive = courierAccounts.find((a) => a.provider === "PATHAO" && a.is_active);
    const existingConsignment = initialConsignments?.[0];

    // Shipping Location State
    const [cities, setCities] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);

    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedZone, setSelectedZone] = useState<string>("");
    const [selectedArea, setSelectedArea] = useState<string>("");

    const [loadingLocations, setLoadingLocations] = useState(false);
    const [estimating, setEstimating] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [booking, setBooking] = useState(false);

    // Fetch cities on mount if Pathao is active and no consignment exists
    useEffect(() => {
        if (pathaoActive && !existingConsignment && ["CONFIRMED", "PROCESSING"].includes(orderStatus)) {
            const fetchCities = async () => {
                setLoadingLocations(true);
                const res = await getCourierLocations(shopId, { provider: "PATHAO" });
                setLoadingLocations(false);
                if (res.success && Array.isArray(res.data)) {
                    setCities(res.data);
                }
            };
            fetchCities();
        }
    }, [pathaoActive, existingConsignment, orderStatus, shopId]);

    // Fetch zones when city changes
    const handleCityChange = async (cityIdStr: string) => {
        setSelectedCity(cityIdStr);
        setSelectedZone("");
        setSelectedArea("");
        setZones([]);
        setAreas([]);
        setEstimatedPrice(null);

        const cityId = parseInt(cityIdStr, 10);
        if (isNaN(cityId)) return;

        setLoadingLocations(true);
        const res = await getCourierLocations(shopId, { provider: "PATHAO", city_id: cityId });
        setLoadingLocations(false);
        if (res.success && Array.isArray(res.data)) {
            setZones(res.data);
        }
    };

    // Fetch areas when zone changes
    const handleZoneChange = async (zoneIdStr: string) => {
        setSelectedZone(zoneIdStr);
        setSelectedArea("");
        setAreas([]);
        setEstimatedPrice(null);

        const zoneId = parseInt(zoneIdStr, 10);
        if (isNaN(zoneId)) return;

        setLoadingLocations(true);
        const res = await getCourierLocations(shopId, { provider: "PATHAO", zone_id: zoneId });
        setLoadingLocations(false);
        if (res.success && Array.isArray(res.data)) {
            setAreas(res.data);
        }
    };

    const handleEstimatePrice = async () => {
        if (!selectedCity || !selectedZone) {
            toast.error("Please select a City and Zone to calculate rates.");
            return;
        }

        setEstimating(true);
        const res = await estimateShippingPrice(shopId, {
            provider: "PATHAO",
            price_request: {
                item_weight: 0.5,
                recipient_city: parseInt(selectedCity, 10),
                recipient_zone: parseInt(selectedZone, 10),
            },
        });
        setEstimating(false);

        if (!res.success) {
            toast.error(res.error || "Price estimation failed.");
            return;
        }

        if (res.data) {
            // Pathao price-plan response maps estimated delivery charge
            const price = res.data.price || res.data.data?.price || res.data.estimated_delivery_fee;
            if (price !== undefined) {
                setEstimatedPrice(price);
                toast.success(`Estimated price: ৳${price}`);
            } else {
                toast.error("Could not fetch price from Pathao response.");
            }
        }
    };

    const handleBookShipment = async () => {
        if (!selectedCity || !selectedZone || !selectedArea) {
            toast.error("Please fill in City, Zone, and Area coordinates.");
            return;
        }

        setBooking(true);
        const res = await createShipment(shopId, {
            order_id: orderId,
            provider: "PATHAO",
        });
        setBooking(false);

        if (res.success) {
            toast.success("Shipment booked successfully with Pathao!");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Booking failed.");
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "DELIVERED": return "success";
            case "DISPATCHED":
            case "IN_TRANSIT": return "warning";
            case "FAILED":
            case "RTO": return "destructive";
            case "CREATED":
            default: return "default";
        }
    };

    // 1. Shipment already booked
    if (existingConsignment) {
        return (
            <Card className="border-primary/25">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <IconTruck className="size-5 text-emerald-500" />
                            Courier Consignment
                        </span>
                        <Badge variant={getStatusVariant(existingConsignment.status)}>
                            {existingConsignment.status_display}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Fulfillment processed via {existingConsignment.provider_display}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-1.5 text-sm">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Tracking ID:</span>
                            <span className="font-mono text-xs font-semibold">{existingConsignment.tracking_code}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Provider Reference:</span>
                            <span className="font-mono text-xs">{existingConsignment.external_consignment_id}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-muted-foreground">Booked Date:</span>
                            <span>{new Date(existingConsignment.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/shipping" className="gap-2">
                            Go to Shipments List
                            <IconExternalLink className="size-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // 2. No active courier configured
    if (!pathaoActive) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <IconTruck className="size-5 text-muted-foreground" />
                        Fulfillment
                    </CardTitle>
                    <CardDescription>
                        No active shipping service connected.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-xs flex gap-2 items-start text-muted-foreground">
                        <IconAlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                        <p>Configure Pathao credentials under settings to unlock automated shipping.</p>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/settings/shipping">Configure Shipping</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // 3. Courier active, but order is in wrong status (e.g. PENDING or CANCELLED)
    if (!["CONFIRMED", "PROCESSING"].includes(orderStatus)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <IconTruck className="size-5 text-muted-foreground" />
                        Fulfillment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Fulfillment booking becomes available once the order status is updated to <strong>CONFIRMED</strong> or <strong>PROCESSING</strong>.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // 4. Eligible to book
    return (
        <Card className="border-amber-500/25">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <IconTruck className="size-5 text-primary" />
                    Book Courier
                </CardTitle>
                <CardDescription>
                    Fill in pickup details to register shipment with Pathao.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {/* City Select */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="city">City</Label>
                        <Select value={selectedCity} onValueChange={handleCityChange} disabled={loadingLocations}>
                            <SelectTrigger id="city">
                                <SelectValue placeholder={loadingLocations ? "Loading..." : "Select City"} />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map((city) => (
                                    <SelectItem key={city.id} value={String(city.id)}>
                                        {city.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Zone Select */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="zone">Zone</Label>
                        <Select value={selectedZone} onValueChange={handleZoneChange} disabled={!selectedCity || loadingLocations}>
                            <SelectTrigger id="zone">
                                <SelectValue placeholder="Select Zone" />
                            </SelectTrigger>
                            <SelectContent>
                                {zones.map((zone) => (
                                    <SelectItem key={zone.id} value={String(zone.id)}>
                                        {zone.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Area Select */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="area">Area</Label>
                        <Select value={selectedArea} onValueChange={setSelectedArea} disabled={!selectedZone || loadingLocations}>
                            <SelectTrigger id="area">
                                <SelectValue placeholder="Select Area" />
                            </SelectTrigger>
                            <SelectContent>
                                {areas.map((area) => (
                                    <SelectItem key={area.id} value={String(area.id)}>
                                        {area.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Estimate Info */}
                    {estimatedPrice !== null && (
                        <div className="p-3 bg-emerald-500/10 rounded-lg flex items-center justify-between text-sm text-emerald-500 font-semibold border border-emerald-500/20">
                            <span className="flex items-center gap-1.5"><IconCash className="size-4" /> Estimated Cost:</span>
                            <span>৳ {estimatedPrice}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleEstimatePrice}
                        disabled={estimating || !selectedZone}
                        className="w-full text-xs"
                    >
                        {estimating && <IconLoader2 className="size-3.5 mr-1.5 animate-spin" />}
                        Estimate Price
                    </Button>
                    <Button
                        type="button"
                        onClick={handleBookShipment}
                        disabled={booking || !selectedArea}
                        className="w-full text-xs"
                    >
                        {booking && <IconLoader2 className="size-3.5 mr-1.5 animate-spin" />}
                        Book Pathao
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
