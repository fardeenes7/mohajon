import { requireActiveShopContext } from "@/lib/shop-context";
import { getConsignments } from "@/lib/api";
import { ShippingClient } from "./ShippingClient";

export const metadata = {
    title: "Shipments",
    description: "Manage and track order shipments booked through integrated couriers.",
};

export default async function ShippingPage() {
    const context = await requireActiveShopContext();
    const shopId = String(context.shop.id);

    const consignmentsRes = await getConsignments(shopId);
    const initialConsignments = consignmentsRes.success ? consignmentsRes.data : [];

    return (
        <ShippingClient
            shopId={shopId}
            initialConsignments={initialConsignments}
        />
    );
}
