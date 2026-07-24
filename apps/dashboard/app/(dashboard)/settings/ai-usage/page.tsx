import { Suspense } from "react";
import { getActiveShopContext, getShopSettings, getAiCreditLogs, finalizeTopUp } from "@/lib/api";
import { getDefaultDateRange } from "@/lib/date-utils";
import { BuyCreditsDialog } from "./BuyCreditsDialog";
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
import { DateFilter } from "./DateFilter";
import { Pagination } from "./Pagination";
import { TopUpResultToast } from "./TopUpResultToast";

export const metadata = {
    title: "AI Usage & Credits Overview | Dashboard",
};

export default async function AiUsageOverviewPage({
    searchParams,
}: {
    searchParams: Promise<{ paymentID?: string; status?: string; page?: string; start_date?: string; end_date?: string }>;
}) {
    const shopRes = await getActiveShopContext();
    if (!shopRes.success) return <div>Failed to load shop context</div>;
    const shopId = shopRes.data.id;

    const params = await searchParams;

    // Handle bKash top-up callback
    let topUpResult = null;
    if (params.paymentID && params.status === "success") {
        const res = await finalizeTopUp(shopId, params.paymentID);
        topUpResult = res.success ? { status: "success" } : { status: "error", message: res.error };
    } else if (params.status === "cancel" || params.status === "failure") {
        topUpResult = { status: "cancelled" };
    }

    // Default filters: 1st of current month to today (Asia/Dhaka timezone)
    const { defaultStartDate, defaultEndDate } = getDefaultDateRange();

    const page = Number(params.page) || 1;
    const startDate = params.start_date || defaultStartDate;
    const endDate = params.end_date || defaultEndDate;

    const [settingsRes, topupsRes] = await Promise.all([
        getShopSettings(shopId),
        getAiCreditLogs(shopId, { page, start_date: startDate, end_date: endDate }),
    ]);

    const creditBalance = settingsRes.success ? settingsRes.data.ai_credit_balance : 0;
    
    // Handle paginated or list response
    const topupsData = topupsRes.success ? topupsRes.data : null;
    const isPaginated = topupsData && !Array.isArray(topupsData) && "results" in topupsData;
    const logs = isPaginated ? topupsData.results : (Array.isArray(topupsData) ? topupsData : []);
    
    const hasNextPage = isPaginated ? !!topupsData.next : false;
    const hasPreviousPage = isPaginated ? !!topupsData.previous : false;

    return (
        <div className="flex flex-col gap-6">
            <TopUpResultToast result={topUpResult} />

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <CardTitle>Current AI Credits</CardTitle>
                        <CardDescription>Your available credit balance for AI features.</CardDescription>
                    </div>
                    <BuyCreditsDialog shopId={shopId} />
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{parseFloat(creditBalance?.toString() || "0").toFixed(2)}</div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Credit Ledger</CardTitle>
                        <CardDescription>Log of all AI credit grants and balances.</CardDescription>
                    </div>
                    <DateFilter defaultStartDate={defaultStartDate} defaultEndDate={defaultEndDate} />
                </CardHeader>
                <CardContent className="p-0">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground border-t border-dashed">
                            No credit grants found for this period.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Granted</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead className="text-right pr-6">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="pl-6 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{log.category_display}</TableCell>
                                        <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                                            +{parseFloat(log.credits_granted).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {parseFloat(log.credits_remaining).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {log.expires_at ? new Date(log.expires_at).toLocaleDateString() : "Never"}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {log.is_exhausted ? (
                                                <Badge variant="secondary">Exhausted</Badge>
                                            ) : log.is_expired ? (
                                                <Badge variant="destructive">Expired</Badge>
                                            ) : (
                                                <Badge variant="default">Active</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    
                    {(hasNextPage || hasPreviousPage) && (
                        <Pagination 
                            currentPage={page} 
                            hasNextPage={hasNextPage} 
                            hasPreviousPage={hasPreviousPage} 
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
