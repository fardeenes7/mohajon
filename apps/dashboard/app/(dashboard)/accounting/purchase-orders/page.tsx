import { requireActiveShopContext } from "@/lib/shop-context";
import { getPurchaseOrders } from "@/lib/api";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    IconBox,
    IconPlus,
    IconTruckDelivery,
    IconCalendar,
    IconCurrencyTaka
} from "@tabler/icons-react";
import { CreatePurchaseOrderDialog } from "./CreatePurchaseOrderDialog";
import { PurchaseOrderActions } from "./PurchaseOrderActions";

export default async function PurchaseOrdersPage() {
    const context = await requireActiveShopContext();
    const poRes = await getPurchaseOrders(context.shopId);

    const purchaseOrders = poRes.success ? poRes.data.results : [];

    const getStatusVariant = (status: string): "success" | "warning" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "RECEIVED": return "success";
            case "ORDERED": return "warning";
            case "DRAFT": return "secondary";
            case "CANCELLED": return "destructive";
            default: return "outline";
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground">Manage inventory acquisitions and track stock costs.</p>
                </div>
                <CreatePurchaseOrderDialog
                    shopId={context.shopId}
                    currency={context.baseCurrency}
                />
            </header>

            <div className="grid gap-6">
                {purchaseOrders && purchaseOrders.length > 0 ? (
                    purchaseOrders.map((po: any) => (
                        <Card key={po.id} className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <IconBox className="size-5 text-primary" />
                                            {po.supplier_name}
                                        </CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <IconCalendar className="size-3.5" />
                                                Created: {new Date(po.created_at).toLocaleDateString()}
                                            </span>
                                            {po.received_at && (
                                                <span className="flex items-center gap-1 text-success">
                                                    <IconTruckDelivery className="size-3.5" />
                                                    Received: {new Date(po.received_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusVariant(po.status)}>{po.status}</Badge>
                                        <PurchaseOrderActions
                                            shopId={context.shopId}
                                            poId={po.id}
                                            status={po.status}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-4 bg-card">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-muted-foreground">
                                            {po.items_json?.length || 0} items in this order
                                        </div>
                                        <div className="flex items-center gap-1 font-bold text-lg">
                                            <IconCurrencyTaka className="size-5" />
                                            {po.total_amount}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <IconBox className="size-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No Purchase Orders</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                            You haven't created any purchase orders yet. Start by adding your first supplier order.
                        </p>
                        <CreatePurchaseOrderDialog
                            shopId={context.shopId}
                            currency={context.baseCurrency}
                            trigger={
                                <Button variant="outline" className="mt-6 gap-2">
                                    <IconPlus className="size-4" />
                                    Create PO
                                </Button>
                            }
                        />
                    </Card>
                )}
            </div>
        </div>
    );
}
