import { Suspense } from "react";
import { getActiveShopContext, getShopSettings, getAiUsageLog, finalizeTopUp } from "@/lib/api";
import { AiUsageClient, type TopUpResult } from "./AiUsageClient";
import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import { Separator } from "@repo/ui/components/ui/separator";

export const metadata = {
    title: "AI Usage & Credits - Dashboard",
};

export default async function AiUsagePage({
    searchParams,
}: {
    searchParams: Promise<{ paymentID?: string; status?: string }>;
}) {
    const shopRes = await getActiveShopContext();
    if (!shopRes.success) return <div>Failed to load shop context</div>;
    const shopId = shopRes.data.id;

    // Handle the bKash callback: after payment, bKash redirects back here with
    // paymentID + status. Finalize the top-up server-side, then report the result.
    const params = await searchParams;
    let topUpResult: TopUpResult = null;
    if (params.paymentID && params.status === "success") {
        const res = await finalizeTopUp(shopId, params.paymentID);
        topUpResult = res.success ? { status: "success" } : { status: "error", message: res.error };
    } else if (params.status === "cancel" || params.status === "failure") {
        topUpResult = { status: "cancelled" };
    }

    const [settingsRes, usageRes] = await Promise.all([
        getShopSettings(shopId),
        getAiUsageLog(shopId),
    ]);

    const creditBalance = settingsRes.success ? settingsRes.data.ai_credit_balance : 0;
    const usageLogs = usageRes.success ? usageRes.data : [];

    return (
        <div className="flex flex-col gap-6">
            <div className="h-header flex items-center justify-between sticky top-0 z-20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-3 border-b -mx-6 px-6 -mt-6 mb-2">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6" />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">AI Usage & Credits</h1>
                    </div>
                </div>
            </div>

            <Suspense fallback={<div>Loading AI usage...</div>}>
                <AiUsageClient
                    shopId={shopId}
                    initialCreditBalance={creditBalance}
                    initialUsageLogs={usageLogs}
                    topUpResult={topUpResult}
                />
            </Suspense>
        </div>
    );
}
