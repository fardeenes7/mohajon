import Link from "next/link";
import { requireActiveShopContext } from "@/lib/shop-context";
import { Button } from "@repo/ui/components/ui/button";
import { IconLock } from "@tabler/icons-react";
import { PosClient } from "./PosClient";

export default async function PosPage() {
    const context = await requireActiveShopContext();

    if (!context.subscription.limits.pos_system) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <IconLock className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-xl font-bold">
                        POS is a Pro feature
                    </h1>
                    <p className="max-w-sm text-muted-foreground">
                        Your current {context.subscription.tier} plan
                        doesn&apos;t include the retail POS system. Upgrade to
                        start ringing up in-store sales.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/settings/billing">View plans</Link>
                </Button>
            </div>
        );
    }

    return (
        <PosClient shopId={context.shopId} currency={context.baseCurrency} />
    );
}
