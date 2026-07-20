"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { receivePurchaseOrder, cancelPurchaseOrder } from "@/lib/api";
import { Button } from "@repo/ui/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";

type PurchaseOrderActionsProps = {
    shopId: string;
    poId: string;
    status: string;
};

export function PurchaseOrderActions({ shopId, poId, status }: PurchaseOrderActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const canReceive = status === "DRAFT" || status === "ORDERED";
    const canCancel = status === "DRAFT" || status === "ORDERED";

    const handleReceive = () => {
        startTransition(async () => {
            const res = await receivePurchaseOrder(shopId, poId);
            if (res.success) {
                toast.success("Purchase order received. Stock and costs updated.");
                router.refresh();
            } else {
                toast.error(res.error || "Couldn't receive this purchase order.");
            }
        });
    };

    const handleCancel = () => {
        startTransition(async () => {
            const res = await cancelPurchaseOrder(shopId, poId);
            if (res.success) {
                toast.success("Purchase order cancelled.");
                router.refresh();
            } else {
                toast.error(res.error || "Couldn't cancel this purchase order.");
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" disabled={isPending}>
                    <IconDotsVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {canReceive && (
                    <DropdownMenuItem onSelect={handleReceive}>Mark as Received</DropdownMenuItem>
                )}
                {canCancel && (
                    <DropdownMenuItem className="text-destructive" onSelect={handleCancel}>
                        Cancel PO
                    </DropdownMenuItem>
                )}
                {!canReceive && !canCancel && (
                    <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
