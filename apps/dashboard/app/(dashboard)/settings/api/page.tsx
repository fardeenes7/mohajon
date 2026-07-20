import { requireActiveShopContext } from "@/lib/shop-context";
import { Badge } from "@repo/ui/components/ui/badge";
import { DeveloperApiClient } from "./DeveloperApiClient";

export default async function DeveloperApiPage() {
    const context = await requireActiveShopContext();
    const { shop, subscription } = context;

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Developer API
                    </h1>
                    <Badge variant="outline">{subscription.tier}</Badge>
                </div>
                <p className="text-muted-foreground">
                    Connect your {shop.name} data to external B2B systems via our
                    REST API.
                </p>
            </header>

            <DeveloperApiClient shopId={context.shopId} />
        </div>
    );
}
