import { requireActiveShopContext } from "@/lib/shop-context";
import { getShop } from "@/lib/api";
import { ProfileForm, type ShopProfile } from "./ProfileForm";

export default async function ProfileSettingsPage() {
    const context = await requireActiveShopContext();
    const res = await getShop(context.shopId);

    const initialData: ShopProfile = res.success
        ? {
              name: res.data?.name ?? context.shop.name,
              subdomain: res.data?.subdomain ?? context.shop.subdomain,
              base_currency:
                  res.data?.base_currency ?? context.shop.base_currency,
          }
        : {
              name: context.shop.name,
              subdomain: context.shop.subdomain,
              base_currency: context.shop.base_currency,
          };

    return <ProfileForm shopId={context.shopId} initialData={initialData} />;
}
