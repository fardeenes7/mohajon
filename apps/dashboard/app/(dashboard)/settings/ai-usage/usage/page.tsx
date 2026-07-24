import { getActiveShopContext, getAiUsageLog } from "@/lib/api";
import { getDefaultDateRange } from "@/lib/date-utils";
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
import { DateFilter } from "../DateFilter";
import { Pagination } from "../Pagination";

export const metadata = {
    title: "AI Usage History | Dashboard",
};

export default async function AiUsageHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; start_date?: string; end_date?: string }>;
}) {
    const shopRes = await getActiveShopContext();
    if (!shopRes.success) return <div>Failed to load shop context</div>;
    const shopId = shopRes.data.id;

    const params = await searchParams;

    // Default filters: 1st of current month to today (Asia/Dhaka timezone)
    const { defaultStartDate, defaultEndDate } = getDefaultDateRange();

    const page = Number(params.page) || 1;
    const startDate = params.start_date || defaultStartDate;
    const endDate = params.end_date || defaultEndDate;

    const usageRes = await getAiUsageLog(shopId, { page, start_date: startDate, end_date: endDate });
    
    const usageData = usageRes.success ? usageRes.data : null;
    const isPaginated = usageData && !Array.isArray(usageData) && "results" in usageData;
    const logs = isPaginated ? usageData.results : (Array.isArray(usageData) ? usageData : []);
    
    const hasNextPage = isPaginated ? !!usageData.next : false;
    const hasPreviousPage = isPaginated ? !!usageData.previous : false;

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Usage History</CardTitle>
                    <CardDescription>A log of all AI feature usage and credit deductions.</CardDescription>
                </div>
                <DateFilter defaultStartDate={defaultStartDate} defaultEndDate={defaultEndDate} />
            </CardHeader>
            <CardContent className="p-0">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground border-t border-dashed">
                        No AI usage history found for this period.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Date</TableHead>
                                <TableHead>Feature</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Tokens</TableHead>
                                <TableHead className="text-right pr-6">Credits Deducted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log: any) => (
                                <TableRow key={log.id}>
                                    <TableCell className="pl-6 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.usage_type}</Badge>
                                    </TableCell>
                                    <TableCell>{log.model_name}</TableCell>
                                    <TableCell>{log.total_tokens || "N/A"}</TableCell>
                                    <TableCell className="text-right font-mono text-destructive pr-6">
                                        -{parseFloat(log.credits_deducted).toFixed(4)}
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
    );
}
