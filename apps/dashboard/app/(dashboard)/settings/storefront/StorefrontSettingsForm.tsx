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
import { Switch } from "@repo/ui/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { updateShopSettings } from "@/lib/api";

export type ShopSettings = {
    show_stock_count: boolean;
    enable_product_reviews: boolean;
    maintenance_mode: boolean;
    allow_guest_checkout: boolean;
    tax_calculation_base: "ORIGINAL" | "DISCOUNTED";
    discount_application: "EXCLUSIVE" | "INCLUSIVE";
};

export function StorefrontSettingsForm({
    shopId,
    initialData,
}: {
    shopId: string;
    initialData: ShopSettings;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState<ShopSettings>(initialData);

    const set = <K extends keyof ShopSettings>(
        key: K,
        value: ShopSettings[K],
    ) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        const res = await updateShopSettings(shopId, form);
        if (res.success) {
            toast.success("Storefront settings saved.");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Failed to save settings.");
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Storefront Toggles
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Control the visibility of features on your public
                        storefront.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isPending}>
                    <IconDeviceFloppy className="size-4 mr-2" />
                    Save Changes
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Display Preferences</CardTitle>
                        <CardDescription>
                            Configure what your customers can see on the product
                            pages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                    Show Stock Count
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Display the exact remaining inventory
                                    quantity to customers.
                                </span>
                            </div>
                            <Switch
                                checked={form.show_stock_count}
                                onCheckedChange={(v) =>
                                    set("show_stock_count", v)
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                    Enable Product Reviews
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Allow customers to leave reviews on your
                                    products.
                                </span>
                            </div>
                            <Switch
                                checked={form.enable_product_reviews}
                                onCheckedChange={(v) =>
                                    set("enable_product_reviews", v)
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                    Allow Guest Checkout
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Let customers place orders without creating
                                    an account.
                                </span>
                            </div>
                            <Switch
                                checked={form.allow_guest_checkout}
                                onCheckedChange={(v) =>
                                    set("allow_guest_checkout", v)
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                    Maintenance Mode
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Temporarily disable the storefront and show a
                                    maintenance page.
                                </span>
                            </div>
                            <Switch
                                checked={form.maintenance_mode}
                                onCheckedChange={(v) =>
                                    set("maintenance_mode", v)
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tax & Discount Rules</CardTitle>
                        <CardDescription>
                            Configure how prices, taxes, and discounts are
                            calculated at checkout.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Label>Tax Calculation Base</Label>
                            <Select
                                value={form.tax_calculation_base}
                                onValueChange={(v) =>
                                    set(
                                        "tax_calculation_base",
                                        v as ShopSettings["tax_calculation_base"],
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select calculation base" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ORIGINAL">
                                        Calculate Tax on Original Price
                                    </SelectItem>
                                    <SelectItem value="DISCOUNTED">
                                        Calculate Tax on Discounted Price
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Determines whether tax is applied before or after
                                discounts.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Discount Application</Label>
                            <Select
                                value={form.discount_application}
                                onValueChange={(v) =>
                                    set(
                                        "discount_application",
                                        v as ShopSettings["discount_application"],
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select discount application" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXCLUSIVE">
                                        Discount is Exclusive of Tax
                                    </SelectItem>
                                    <SelectItem value="INCLUSIVE">
                                        Discount is Inclusive of Tax
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Determines if the discount value reduces the tax
                                amount (Inclusive) or not (Exclusive).
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
