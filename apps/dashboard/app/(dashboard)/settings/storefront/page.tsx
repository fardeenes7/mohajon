import { requireActiveShopContext } from "@/lib/shop-context";
import { getShopSettings } from "@/lib/api";
import {
    StorefrontSettingsForm,
    type ShopSettings,
} from "./StorefrontSettingsForm";

const DEFAULTS: ShopSettings = {
    show_stock_count: true,
    enable_product_reviews: true,
    maintenance_mode: false,
    allow_guest_checkout: true,
    tax_calculation_base: "DISCOUNTED",
    discount_application: "EXCLUSIVE",
};

export default async function StorefrontSettingsPage() {
    const context = await requireActiveShopContext();
    const res = await getShopSettings(context.shopId);

    const initialData: ShopSettings = res.success
        ? { ...DEFAULTS, ...res.data }
        : DEFAULTS;

    return (
        <StorefrontSettingsForm
            shopId={context.shopId}
            initialData={initialData}
        />
    );
}
