"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { IconLoader2, IconSparkles, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { getCreditPackages, initiateTopUp } from "@/lib/api";

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    retail_price_bdt: string;
}

export function BuyCreditsDialog({ shopId }: { shopId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    const loadPackages = async () => {
        setLoading(true);
        const res = await getCreditPackages(shopId);
        setLoading(false);
        if (res.success) {
            setPackages(res.data || []);
        } else {
            toast.error(res.error || "Failed to load credit packages.");
        }
    };

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (next && packages.length === 0) {
            loadPackages();
        }
        if (!next) {
            setSelectedId(null);
        }
    };

    const handlePurchase = async () => {
        if (!selectedId) {
            toast.error("Please select a package.");
            return;
        }
        setRedirecting(true);
        const callbackUrl = `${window.location.origin}/settings/ai-usage`;
        const res = await initiateTopUp(shopId, selectedId, callbackUrl);

        // bKash returns a redirect URL under bkashURL. Send the browser there.
        const bkashURL = res.success ? res.data?.bkashURL : undefined;
        if (bkashURL) {
            window.location.href = bkashURL;
            return; // keep the spinner up while navigating away
        }

        setRedirecting(false);
        toast.error(res.success ? "Payment could not be started. Please try again." : res.error || "Failed to start payment.");
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <IconSparkles className="size-4" />
                    Buy Credits
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Buy AI Credits</DialogTitle>
                    <DialogDescription>
                        Pick a package and pay securely via bKash. Credits are added to your balance
                        once payment completes.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <IconLoader2 className="size-5 animate-spin" />
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                            No credit packages are available right now.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {packages.map((pkg) => {
                                const isSelected = selectedId === pkg.id;
                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSelectedId(pkg.id)}
                                        className={cn(
                                            "relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                                            isSelected
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-border hover:border-primary/50",
                                        )}
                                    >
                                        {isSelected && (
                                            <IconCheck className="absolute right-3 top-3 size-4 text-primary" />
                                        )}
                                        <span className="text-sm font-medium">{pkg.name}</span>
                                        <span className="text-2xl font-bold">
                                            {pkg.credits}
                                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                credits
                                            </span>
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            ৳ {parseFloat(pkg.retail_price_bdt).toFixed(2)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={redirecting}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handlePurchase} disabled={redirecting || !selectedId}>
                        {redirecting && <IconLoader2 className="size-4 animate-spin" />}
                        Continue to bKash
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
