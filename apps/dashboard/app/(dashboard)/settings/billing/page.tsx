import { requireActiveShopContext } from "@/lib/shop-context";
import { getProducts, getShopTeam } from "@/lib/api";
import { Button } from "@repo/ui/components/ui/button";
import { IconCheck, IconCrown, IconRocket, IconStar } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Progress } from "@repo/ui/components/ui/progress";

function usagePercent(used: number, limit: number) {
    if (!limit || limit >= 999999) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
}

export default async function BillingPage() {
    const context = await requireActiveShopContext();
    const { subscription } = context;

    const [productsRes, teamRes] = await Promise.all([
        getProducts(context.shopId, { page: 1, page_size: 1 }),
        getShopTeam(context.shopId),
    ]);

    const productCount = productsRes.success ? productsRes.data.count ?? 0 : 0;
    const staffCount =
        teamRes.success && Array.isArray(teamRes.data) ? teamRes.data.length : 0;

    const plans = [
        {
            name: "FREE",
            display: "Free",
            price: "0 ৳",
            icon: IconStar,
            features: ["1 Store", "5 Products", "1 Staff", "Forced Branding"],
            current: subscription.tier === "FREE",
        },
        {
            name: "BASIC",
            display: "Basic",
            price: "990 ৳/mo",
            icon: IconRocket,
            features: ["3 Stores", "50 Products", "3 Staff", "Removable Branding", "Marketing Pixels"],
            current: subscription.tier === "BASIC",
        },
        {
            name: "PRO",
            display: "Pro",
            price: "1,990 ৳/mo",
            icon: IconCrown,
            features: ["Unlimited Stores", "Unlimited Products", "10 Staff", "POS System", "Advanced Accounting"],
            current: subscription.tier === "PRO",
        },
        {
            name: "BUSINESS",
            display: "Business",
            price: "4,990 ৳/mo",
            icon: IconCrown,
            features: ["Everything in Pro", "Unlimited Staff", "B2B / Store Credit", "Developer API", "1,000 AI Credits"],
            current: subscription.tier === "BUSINESS",
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground">Manage your plan and view usage limits.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan) => (
                    <div 
                        key={plan.name} 
                        className={`relative rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${plan.current ? 'border-primary ring-1 ring-primary' : 'bg-card'}`}
                    >
                        {plan.current && (
                            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1">
                                Current Plan
                            </Badge>
                        )}
                        <div className="flex flex-col h-full">
                            <div className="mb-4 flex items-center gap-2">
                                <plan.icon className={`size-5 ${plan.current ? 'text-primary' : 'text-muted-foreground'}`} />
                                <h3 className="font-bold">{plan.display}</h3>
                            </div>
                            <div className="mb-6">
                                <span className="text-3xl font-bold">{plan.price}</span>
                                {plan.name !== "FREE" && <span className="text-sm text-muted-foreground"> / month</span>}
                            </div>
                            <ul className="mb-8 space-y-2 text-sm flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <IconCheck className="size-4 text-primary" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button 
                                variant={plan.current ? "outline" : "default"} 
                                className="w-full"
                                disabled={plan.current}
                            >
                                {plan.current ? "Manage Plan" : "Upgrade"}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-bold">Usage Limits</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 flex justify-between text-sm">
                                <span>Products</span>
                                <span className="font-medium tabular-nums">
                                    {subscription.limits.max_products >= 999999
                                        ? `${productCount} / Unlimited`
                                        : `${productCount} / ${subscription.limits.max_products}`}
                                </span>
                            </div>
                            <Progress
                                value={usagePercent(
                                    productCount,
                                    subscription.limits.max_products,
                                )}
                            />
                        </div>
                        <div>
                            <div className="mb-2 flex justify-between text-sm">
                                <span>Staff Accounts</span>
                                <span className="font-medium tabular-nums">
                                    {subscription.limits.max_staff >= 999999
                                        ? `${staffCount} / Unlimited`
                                        : `${staffCount} / ${subscription.limits.max_staff}`}
                                </span>
                            </div>
                            <Progress
                                value={usagePercent(
                                    staffCount,
                                    subscription.limits.max_staff,
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-bold">Billing Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={subscription.status === "ACTIVE" ? "success" : "destructive"}>
                                {subscription.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Last Payment</span>
                            <span>{subscription.last_paid_at ? new Date(subscription.last_paid_at).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Next Renewal</span>
                            <span>{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
