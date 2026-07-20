import { requireActiveShopContext } from "@/lib/shop-context";
import { CustomersClient } from "./CustomersClient";

export default async function CustomersPage() {
    const context = await requireActiveShopContext();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                <p className="text-muted-foreground">
                    Look up a buyer by phone to review their order history and fraud risk before
                    fulfilling.
                </p>
            </div>

            <CustomersClient shopId={context.shopId} />
        </div>
    );
}
