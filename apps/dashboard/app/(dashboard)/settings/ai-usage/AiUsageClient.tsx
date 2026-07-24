"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { toast } from "sonner";
import { BuyCreditsDialog } from "./BuyCreditsDialog";

export type TopUpResult =
    | { status: "success" }
    | { status: "error"; message?: string }
    | { status: "cancelled" }
    | null;

interface AiUsageClientProps {
    shopId: string;
    initialCreditBalance: number;
    initialUsageLogs: any[];
    topUpResult?: TopUpResult;
}

export function AiUsageClient({ shopId, initialCreditBalance, initialUsageLogs, topUpResult }: AiUsageClientProps) {
    const [logs] = useState<any[]>(initialUsageLogs || []);
    const router = useRouter();
    const pathname = usePathname();
    const handledResult = useRef(false);

    useEffect(() => {
        if (!topUpResult || handledResult.current) return;
        handledResult.current = true;

        if (topUpResult.status === "success") {
            toast.success("Credits added to your balance.");
        } else if (topUpResult.status === "cancelled") {
            toast.info("Payment cancelled. No credits were purchased.");
        } else {
            toast.error(topUpResult.message || "Payment failed. Please try again.");
        }

        // Strip the bKash callback params so a refresh doesn't re-toast.
        router.replace(pathname);
    }, [topUpResult, router, pathname]);

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <CardTitle>Current AI Credits</CardTitle>
                        <CardDescription>Your available credit balance for AI features.</CardDescription>
                    </div>
                    <BuyCreditsDialog shopId={shopId} />
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{parseFloat(initialCreditBalance?.toString()).toFixed(2)}</div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Usage History</CardTitle>
                    <CardDescription>A log of all AI feature usage and credit deductions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                            No AI usage history found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Feature</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Tokens</TableHead>
                                    <TableHead className="text-right">Credits Deducted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{log.usage_type}</Badge>
                                        </TableCell>
                                        <TableCell>{log.model_name}</TableCell>
                                        <TableCell>{log.total_tokens || "N/A"}</TableCell>
                                        <TableCell className="text-right font-mono text-destructive">
                                            -{parseFloat(log.credits_deducted).toFixed(4)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
