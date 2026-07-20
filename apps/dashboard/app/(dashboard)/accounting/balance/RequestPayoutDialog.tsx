"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestPayout } from "@/lib/api";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { IconArrowUpRight, IconLoader2 } from "@tabler/icons-react";

type RequestPayoutDialogProps = {
    shopId: string;
    availableBalance: string;
    currency: string;
};

export function RequestPayoutDialog({
    shopId,
    availableBalance,
    currency,
}: RequestPayoutDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [amount, setAmount] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    const max = Number(availableBalance) || 0;
    const amountNum = Number(amount);
    const amountInvalid =
        amount !== "" && (Number.isNaN(amountNum) || amountNum <= 0 || amountNum > max);
    const canSubmit =
        amount !== "" &&
        !amountInvalid &&
        accountName.trim() !== "" &&
        accountNumber.trim() !== "";

    const reset = () => {
        setAmount("");
        setAccountName("");
        setAccountNumber("");
        setBankName("");
    };

    const handleSubmit = () => {
        if (!canSubmit) return;
        startTransition(async () => {
            const res = await requestPayout(shopId, {
                amount: amountNum.toFixed(2),
                bank_info: {
                    account_name: accountName.trim(),
                    account_number: accountNumber.trim(),
                    bank_name: bankName.trim(),
                },
            });
            if (res.success) {
                toast.success("Payout requested. It's now pending review.");
                reset();
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Couldn't request payout. Please try again.");
            }
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) reset();
            }}
        >
            <DialogTrigger asChild>
                <Button className="gap-2" disabled={max <= 0}>
                    <IconArrowUpRight className="size-4" />
                    Request Payout
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <DialogDescription>
                        Withdraw from your available balance of {availableBalance} {currency}.
                        Payouts are reviewed before being settled.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="payout-amount">Amount ({currency})</Label>
                        <Input
                            id="payout-amount"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max={max}
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            aria-invalid={amountInvalid}
                        />
                        {amountInvalid && (
                            <p className="text-xs text-destructive">
                                Enter an amount between 0 and {availableBalance} {currency}.
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="payout-account-name">Account Holder Name</Label>
                        <Input
                            id="payout-account-name"
                            placeholder="e.g. Rahim Uddin"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="payout-account-number">Account / MFS Number</Label>
                        <Input
                            id="payout-account-number"
                            placeholder="e.g. 01XXXXXXXXX or bank account no."
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="payout-bank-name">Bank / Provider (optional)</Label>
                        <Input
                            id="payout-bank-name"
                            placeholder="e.g. bKash, City Bank"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit || isPending} className="gap-2">
                        {isPending && <IconLoader2 className="size-4 animate-spin" />}
                        Request Payout
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
