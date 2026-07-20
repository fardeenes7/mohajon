import Statistic, { type DashboardMetrics } from "./stats";
import { requireActiveShopContext } from "@/lib/shop-context";
import { getDashboardMetrics } from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";

const EMPTY_METRICS: DashboardMetrics = {
    total_orders: 0,
    total_revenue: 0,
    low_stock_count: 0,
    unread_inbox_count: 0,
    ai_credits: 0,
};

export default async function DashboardPage() {
    const context = await requireActiveShopContext();
    const metricsRes = await getDashboardMetrics(context.shopId);
    const metrics = metricsRes.success
        ? (metricsRes.data as DashboardMetrics)
        : EMPTY_METRICS;

    return (
        <div className="flex flex-col gap-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
                <p className="text-muted-foreground">
                    A snapshot of {context.shopName} over the last 30 days.
                </p>
            </div>

            <Statistic metrics={metrics} currency={context.baseCurrency} />

            {!metricsRes.success && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Metrics unavailable
                        </CardTitle>
                        <CardDescription>
                            We couldn&apos;t load your dashboard metrics right
                            now. Showing zeros until the connection recovers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent />
                </Card>
            )}
        </div>
    );
}
