import { getFaqList } from "@/lib/api";
import { requireActiveShopContext } from "@/lib/shop-context";
import { FaqClient } from "./FaqClient";

export default async function FAQSettingsPage() {
    const activeShop = await requireActiveShopContext();
    const res = await getFaqList(activeShop.shopId);
    
    // Safely handle failures
    const initialFaqs = res.success ? res.data : [];

    return <FaqClient shopId={activeShop.shopId} initialFaqs={initialFaqs} />;
}
