import { getAffiliateStats } from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@repo/ui/components/ui/card";
import { requireActiveShopContext } from "@/lib/shop-context";
import { CopyLinkButton } from "./CopyLinkButton";

export default async function AffiliatePage() {
    const context = await requireActiveShopContext();
    const shopId = context.shopId;
    const subdomain = context.shop.subdomain;

    const statsRes = await getAffiliateStats(shopId);
    const stats = statsRes.data || {
        total_clicks: 0,
        total_referrals: 0,
        verified_referrals: 0,
        total_reward: 0
    };

    // This link goes to our tracking endpoint which redirects to the main site
    const affiliateLink = `https://api.mohajon.io/api/v1/affiliates/track/?ref=${subdomain}`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Affiliate Program
                </h1>
                <p className="text-muted-foreground">
                    Earn rewards by referring other merchants to Mohajon.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Clicks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.total_clicks}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Signups
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.total_referrals}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Verified
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.verified_referrals}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Rewards Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ৳{stats.total_reward}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                    <CardDescription>
                        Copy this link and share it with other merchants. This
                        is also automatically linked in your storefront footer.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted p-2 rounded text-sm break-all">
                            {affiliateLink}
                        </code>
                        <CopyLinkButton value={affiliateLink} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                        When a merchant signs up via this link, you'll see them
                        listed here. Rewards are applied after their first
                        successful payment.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
