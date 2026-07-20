import { requireActiveShopContext } from "@/lib/shop-context";
import { getShopTeam } from "@/lib/api";
import { TeamClient, type ShopMember } from "./TeamClient";

export default async function TeamSettingsPage() {
    const context = await requireActiveShopContext();
    const res = await getShopTeam(context.shopId);

    const members: ShopMember[] = res.success && Array.isArray(res.data)
        ? res.data
        : [];

    return (
        <TeamClient
            shopId={context.shopId}
            currentRole={context.role}
            members={members}
            loadFailed={!res.success}
        />
    );
}
