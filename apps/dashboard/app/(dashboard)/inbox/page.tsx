import { getInboxList } from "@/lib/api";
import { requireActiveShopContext } from "@/lib/shop-context";
import { InboxClient } from "./InboxClient";

export default async function InboxPage() {
    const activeShop = await requireActiveShopContext();
    const res = await getInboxList(activeShop.shopId);
    
    // We should safely handle failures. If getInboxList fails, we pass empty array or display error.
    const initialConversations = res.success ? res.data : [];

    return <InboxClient shopId={activeShop.shopId} initialConversations={initialConversations} />;
}
