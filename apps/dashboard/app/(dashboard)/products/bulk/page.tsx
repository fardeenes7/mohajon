import { requireActiveShopContext } from "@/lib/shop-context";
import { getProducts } from "@/lib/api";
import { BulkEditorClient, type BulkProduct } from "./BulkEditorClient";

export default async function BulkProductEditorPage() {
    const context = await requireActiveShopContext();
    const res = await getProducts(context.shopId, { page: 1, page_size: 100 });

    const products: BulkProduct[] = res.success
        ? (res.data.results as any[]).map((p) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              base_price: String(p.base_price ?? "0"),
              total_stock: p.total_stock ?? 0,
              status: p.status,
          }))
        : [];

    return (
        <BulkEditorClient shopId={context.shopId} initialProducts={products} />
    );
}
