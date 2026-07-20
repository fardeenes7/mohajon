import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
    IconShoppingCart,
    IconCash,
    IconAlertTriangle,
    IconMessage,
    IconSparkles,
} from "@tabler/icons-react";

export type DashboardMetrics = {
    total_orders: number;
    total_revenue: number;
    low_stock_count: number;
    unread_inbox_count: number;
    ai_credits: number;
};

function formatCurrency(value: number, currency: string) {
    return `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
    }).format(value)} ${currency}`;
}

export default function Statistic({
    metrics,
    currency,
}: {
    metrics: DashboardMetrics;
    currency: string;
}) {
    const cards = [
        {
            title: "Orders",
            value: metrics.total_orders.toLocaleString(),
            icon: IconShoppingCart,
        },
        {
            title: "Revenue",
            value: formatCurrency(metrics.total_revenue, currency),
            icon: IconCash,
        },
        {
            title: "Low Stock",
            value: metrics.low_stock_count.toLocaleString(),
            icon: IconAlertTriangle,
        },
        {
            title: "Unread Inbox",
            value: metrics.unread_inbox_count.toLocaleString(),
            icon: IconMessage,
        },
        {
            title: "AI Credits",
            value: metrics.ai_credits.toLocaleString(),
            icon: IconSparkles,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardContent className="flex items-start justify-between gap-4 p-6">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </p>
                            <p className="text-2xl font-semibold tracking-tight tabular-nums">
                                {card.value}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Last 30 days
                            </p>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <card.icon size={18} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
