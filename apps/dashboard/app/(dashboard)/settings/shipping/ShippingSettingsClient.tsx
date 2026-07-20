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
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { IconTruck, IconChevronRight, IconLoader2, IconSettings } from "@tabler/icons-react";
import { configureCourierAccount } from "@/lib/api";

type CourierAccount = {
    id: string;
    provider: string;
    provider_display: string;
    default_store_id: string;
    label: string;
    is_active: boolean;
    is_test_mode: boolean;
    credentials: Record<string, string>;
};

export function ShippingSettingsClient({
    shopId,
    initialAccounts,
}: {
    shopId: string;
    initialAccounts: CourierAccount[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Currently support Pathao Courier
    const pathaoAccount = initialAccounts.find((a) => a.provider === "PATHAO");

    // Form inputs
    const [clientId, setClientId] = useState(pathaoAccount?.credentials?.client_id ? "" : "");
    const [clientSecret, setClientSecret] = useState(pathaoAccount?.credentials?.client_secret ? "" : "");
    const [username, setUsername] = useState(pathaoAccount?.credentials?.username ? "" : "");
    const [password, setPassword] = useState(pathaoAccount?.credentials?.password ? "" : "");
    const [label, setLabel] = useState(pathaoAccount?.label || "Pathao Delivery");
    const [storeId, setStoreId] = useState(pathaoAccount?.default_store_id || "");
    const [isTestMode, setIsTestMode] = useState(pathaoAccount?.is_test_mode ?? false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const credentials: Record<string, string> = {};
        if (clientId) credentials.client_id = clientId;
        if (clientSecret) credentials.client_secret = clientSecret;
        if (username) credentials.username = username;
        if (password) credentials.password = password;

        const res = await configureCourierAccount(shopId, {
            provider: "PATHAO",
            credentials,
            is_test_mode: isTestMode,
            label: label.trim(),
            default_store_id: storeId.trim(),
        });

        setSaving(false);
        if (res.success) {
            toast.success("Courier account configured successfully.");
            setIsOpen(false);
            // Clear passwords fields
            setClientId("");
            setClientSecret("");
            setUsername("");
            setPassword("");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Failed to configure courier account.");
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <IconTruck className="size-6 text-primary" />
                    Shipping & Couriers
                </h1>
                <p className="text-muted-foreground mt-1">
                    Connect third-party couriers to automate order fulfillment, track consignments, and check rates.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="overflow-hidden border border-muted transition-all hover:border-primary/25">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500 font-bold">
                                P
                            </div>
                            <div>
                                <CardTitle className="text-base">Pathao Courier</CardTitle>
                                <CardDescription>OAuth 2.0 automatic booking & tracking</CardDescription>
                            </div>
                        </div>
                        {pathaoAccount?.is_active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="outline">Not Configured</Badge>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                                {pathaoAccount ? (
                                    <div className="flex flex-col gap-1">
                                        <p><strong>Label:</strong> {pathaoAccount.label}</p>
                                        <p><strong>Store ID:</strong> {pathaoAccount.default_store_id || "None"}</p>
                                        <p>
                                            <strong>Mode:</strong>{" "}
                                            {pathaoAccount.is_test_mode ? (
                                                <span className="text-amber-500">Sandbox (Test)</span>
                                            ) : (
                                                <span className="text-primary">Production</span>
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <p>Connect your Pathao Merchant credentials to book shipments directly from incoming orders.</p>
                                )}
                            </div>

                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant={pathaoAccount ? "outline" : "default"}>
                                        <IconSettings className="size-4 mr-2" />
                                        {pathaoAccount ? "Manage Credentials" : "Connect Account"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Configure Pathao Courier</DialogTitle>
                                        <DialogDescription>
                                            Enter your Pathao Merchant API credentials. You can retrieve these from the Pathao Merchant panel.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleSave} className="space-y-4 py-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2 col-span-2">
                                                <Label htmlFor="courier-label">Integration Label</Label>
                                                <Input
                                                    id="courier-label"
                                                    value={label}
                                                    onChange={(e) => setLabel(e.target.value)}
                                                    placeholder="e.g. My Pathao Courier"
                                                    required
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="client-id">Client ID</Label>
                                                <Input
                                                    id="client-id"
                                                    type="text"
                                                    value={clientId}
                                                    onChange={(e) => setClientId(e.target.value)}
                                                    placeholder={pathaoAccount ? "Configured (Leave blank to keep)" : "Enter Client ID"}
                                                    required={!pathaoAccount}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="client-secret">Client Secret</Label>
                                                <Input
                                                    id="client-secret"
                                                    type="password"
                                                    value={clientSecret}
                                                    onChange={(e) => setClientSecret(e.target.value)}
                                                    placeholder={pathaoAccount ? "Configured (Leave blank to keep)" : "Enter Secret"}
                                                    required={!pathaoAccount}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="username">Merchant Email / Username</Label>
                                                <Input
                                                    id="username"
                                                    type="email"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    placeholder={pathaoAccount ? "Configured (Leave blank to keep)" : "Enter Email"}
                                                    required={!pathaoAccount}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="password">Password</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder={pathaoAccount ? "Configured (Leave blank to keep)" : "Enter Password"}
                                                    required={!pathaoAccount}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2 col-span-2">
                                                <Label htmlFor="store-id">Default Store / Warehouse ID</Label>
                                                <Input
                                                    id="store-id"
                                                    value={storeId}
                                                    onChange={(e) => setStoreId(e.target.value)}
                                                    placeholder="Enter Pathao Store ID"
                                                    required
                                                />
                                                <p className="text-[11px] text-muted-foreground">
                                                    You must define a valid pickup warehouse store ID returned by Pathao.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t pt-4">
                                            <div className="flex flex-col gap-0.5">
                                                <Label htmlFor="test-mode">Sandbox Mode</Label>
                                                <p className="text-xs text-muted-foreground">Connects to Pathao Sandbox testing base URL.</p>
                                            </div>
                                            <Switch
                                                id="test-mode"
                                                checked={isTestMode}
                                                onCheckedChange={setIsTestMode}
                                            />
                                        </div>

                                        <DialogFooter className="pt-4">
                                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={saving || isPending}>
                                                {saving && <IconLoader2 className="size-4 mr-2 animate-spin" />}
                                                Save Config
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
