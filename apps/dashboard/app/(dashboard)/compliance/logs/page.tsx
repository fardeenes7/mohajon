import { requireActiveShopContext } from "@/lib/shop-context";
import { ComplianceLogsClient } from "./ComplianceLogsClient";

export const metadata = {
    title: "Activity & Audit Logs - Dashboard",
};

export default async function ComplianceLogsPage() {
    const context = await requireActiveShopContext();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Activity & Audit Logs</h1>
                <p className="text-muted-foreground">
                    A record of order transitions, message deliveries, inventory movements, and
                    security-relevant events. Useful when reconciling disputes.
                </p>
            </div>

            <ComplianceLogsClient shopId={context.shopId} />
        </div>
    );
}
