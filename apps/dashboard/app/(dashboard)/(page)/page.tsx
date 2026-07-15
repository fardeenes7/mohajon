import Statistic from "./stats";
import { requireActiveShopContext } from "@/lib/shop-context";

export default async function DashboardPage() {
    const shopCtx = await requireActiveShopContext();

    return (
        <div className="container space-y-6 pb-12">
            <Statistic />
        </div>
    );
}
