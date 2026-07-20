import { requireActiveShopContext } from "@/lib/shop-context";
import { getCourierAccounts } from "@/lib/api";
import { ShippingSettingsClient } from "./ShippingSettingsClient";

export const metadata = {
    title: "Shipping Settings",
    description: "Configure courier credentials and default shipping configurations.",
};

export default async function ShippingSettingsPage() {
    const context = await requireActiveShopContext();
    const shopId = String(context.shop.id);

    const accountsRes = await getCourierAccounts(shopId);
    const initialAccounts = accountsRes.success ? accountsRes.data : [];

    return (
        <ShippingSettingsClient
            shopId={shopId}
            initialAccounts={initialAccounts}
        />
    );
}
