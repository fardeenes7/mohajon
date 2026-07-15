"use client";

import { useState } from "react";
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

interface AiUsageClientProps {
    shopId: string;
    initialCreditBalance: number;
    initialUsageLogs: any[];
}

export function AiUsageClient({ shopId, initialCreditBalance, initialUsageLogs }: AiUsageClientProps) {
    const [logs] = useState<any[]>(initialUsageLogs || []);

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Current AI Credits</CardTitle>
                    <CardDescription>Your available credit balance for AI features.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{parseFloat(initialCreditBalance.toString()).toFixed(2)}</div>
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
