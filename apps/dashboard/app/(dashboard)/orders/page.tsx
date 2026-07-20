import { requireActiveShopContext } from "@/lib/shop-context";
import { getOrders } from "@/lib/api";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@repo/ui/components/ui/table";
import { IconEye } from "@tabler/icons-react";
import Link from "next/link";
import { OrdersToolbar } from "./OrdersToolbar";

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const context = await requireActiveShopContext();
    const ordersRes = await getOrders(context.shopId, searchParams);

    const orders = ordersRes.success ? ordersRes.data.results : [];

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning" => {
        switch (status) {
            case "CONFIRMED": return "success";
            case "PENDING": return "secondary";
            case "PROCESSING": return "info";
            case "SHIPPED": return "warning";
            case "DELIVERED": return "success";
            case "CANCELLED": return "destructive";
            case "RETURNED": return "destructive";
            default: return "outline";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">Manage and track your customer orders.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" asChild>
                        <Link href="/pos">Create Order</Link>
                    </Button>
                </div>
            </div>

            <OrdersToolbar />

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders && orders.length > 0 ? (
                            orders.map((order: any) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.short_id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{order.customer?.full_name || "Guest"}</span>
                                            <span className="text-xs text-muted-foreground">{order.customer?.phone_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{order.item_count} items</TableCell>
                                    <TableCell>
                                        {order.total_amount} {order.currency}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/orders/${order.id}`}>
                                                <IconEye className="size-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
