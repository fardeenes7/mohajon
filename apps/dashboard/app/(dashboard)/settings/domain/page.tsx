import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import { IconGlobe, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { requireActiveShopContext } from "@/lib/shop-context";

export default async function DomainSettingsPage() {
    const context = await requireActiveShopContext();
    const { subdomain } = context.shop;
    const liveUrl = `${subdomain}.mohajon.store`;
    const isLive = context.subscription.is_storefront_live;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Custom Domain
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Connect a custom domain to your store to build your
                        brand.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Store Address</CardTitle>
                    <CardDescription>
                        Every store gets a free address on our platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-background">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <IconGlobe className="size-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <a
                                href={`https://${liveUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium truncate hover:underline"
                            >
                                {liveUrl}
                            </a>
                            <span className="text-sm text-muted-foreground">
                                Your free platform subdomain
                            </span>
                        </div>
                        {isLive ? (
                            <Badge className="gap-1">
                                <IconCheck className="size-3" />
                                Live
                            </Badge>
                        ) : (
                            <Badge variant="secondary">Not live</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Connect Existing Domain
                        <Badge variant="outline">Coming soon</Badge>
                    </CardTitle>
                    <CardDescription>
                        Enter the domain you want to connect to your store.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="flex items-end gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-sm font-medium">
                                Domain Name
                            </label>
                            <Input
                                placeholder="e.g. www.mystore.com"
                                disabled
                            />
                        </div>
                        <Button disabled>Connect</Button>
                    </div>

                    <div className="flex items-start gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded border border-amber-200 dark:border-amber-900">
                        <IconAlertCircle className="size-5 shrink-0" />
                        <p className="text-sm">
                            Custom domain connection isn&apos;t available yet.
                            For now, your store is reachable at{" "}
                            <code className="bg-background px-1 border rounded text-foreground">
                                {liveUrl}
                            </code>
                            . We&apos;ll enable custom domains here once the
                            feature ships.
                        </p>
                    </div>

                    <div className="bg-muted p-4 rounded-lg flex flex-col gap-4 text-sm">
                        <h4 className="font-semibold flex items-center gap-2">
                            <IconGlobe className="size-4" />
                            How it will work
                        </h4>
                        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                            <li>
                                Log in to your domain provider (e.g. Namecheap,
                                GoDaddy, Cloudflare).
                            </li>
                            <li>Navigate to the DNS management settings.</li>
                            <li>
                                Create a <strong>CNAME</strong> record pointing
                                to{" "}
                                <code className="bg-background px-1 border rounded text-foreground">
                                    shops.mohajon.store
                                </code>
                            </li>
                            <li>
                                Create an <strong>A</strong> record if using a
                                root domain like mystore.com.
                            </li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
