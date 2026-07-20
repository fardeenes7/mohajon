"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { updateShop } from "@/lib/api";

export type ShopProfile = {
    name: string;
    subdomain: string;
    base_currency: string;
};

const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR", "PKR"];

export function ProfileForm({
    shopId,
    initialData,
}: {
    shopId: string;
    initialData: ShopProfile;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(initialData.name);
    const [currency, setCurrency] = useState(initialData.base_currency);

    // Ensure the persisted currency is always selectable even if non-standard.
    const currencyOptions = CURRENCIES.includes(initialData.base_currency)
        ? CURRENCIES
        : [initialData.base_currency, ...CURRENCIES];

    const isDirty =
        name.trim() !== initialData.name ||
        currency !== initialData.base_currency;

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Shop name can't be empty.");
            return;
        }
        setSaving(true);
        const res = await updateShop(shopId, {
            name: name.trim(),
            base_currency: currency,
        });
        setSaving(false);
        if (res.success) {
            toast.success("Profile updated.");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Failed to update profile.");
        }
    };

    const storeUrl = `${initialData.subdomain}.mohajon.store`;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Shop Profile
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Your store&apos;s name, address, and default currency.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || isPending || !isDirty}
                >
                    <IconDeviceFloppy className="size-4 mr-2" />
                    {saving ? "Saving..." : "Save changes"}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>
                        Basic details that identify your store.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="shop-name">Shop name</Label>
                        <Input
                            id="shop-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your store name"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="shop-url">Store address</Label>
                        <Input id="shop-url" value={storeUrl} readOnly disabled />
                        <p className="text-xs text-muted-foreground">
                            Your free subdomain. Change it or connect a custom
                            domain under Custom Domain.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="shop-currency">Base currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger
                                id="shop-currency"
                                className="max-w-[200px]"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {currencyOptions.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            All product prices inherit this currency. Changing it
                            does not convert existing prices.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
