import { requireActiveShopContext } from "@/lib/shop-context";
import { getOrder, transitionOrder, getCourierAccounts } from "@/lib/api";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { 
    IconArrowLeft, 
    IconCheck, 
    IconTruck, 
    IconPackage, 
    IconX, 
    IconCalendar, 
    IconUser, 
    IconMapPin, 
    IconCreditCard 
} from "@tabler/icons-react";
import Link from "next/link";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@repo/ui/components/ui/table";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FulfillmentCard } from "./FulfillmentCard";

export default async function OrderDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const context = await requireActiveShopContext();
    const [orderRes, courierAccountsRes] = await Promise.all([
        getOrder(context.shopId, params.id),
        getCourierAccounts(context.shopId),
    ]);

    if (!orderRes.success) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-muted-foreground">Order not found or inaccessible.</p>
                <Button asChild variant="outline">
                    <Link href="/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }

    const order = orderRes.data;

    async function handleTransition(toStatus: string) {
        "use server";
        const context = await requireActiveShopContext();
        await transitionOrder(context.shopId, params.id, { to_status: toStatus });
        revalidatePath(`/orders/${params.id}`);
    }

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
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/orders">
                            <IconArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Order #{order.short_id}</h1>
                            <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Placed on {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {order.status === "PENDING" && (
                        <form action={handleTransition.bind(null, "CONFIRMED")}>
                            <Button size="sm" className="gap-2">
                                <IconCheck className="size-4" />
                                Confirm Order
                            </Button>
                        </form>
                    )}
                    {order.status === "CONFIRMED" && (
                        <form action={handleTransition.bind(null, "PROCESSING")}>
                            <Button size="sm" className="gap-2">
                                <IconPackage className="size-4" />
                                Start Processing
                            </Button>
                        </form>
                    )}
                    {order.status === "PROCESSING" && (
                        <form action={handleTransition.bind(null, "SHIPPED")}>
                            <Button size="sm" className="gap-2">
                                <IconTruck className="size-4" />
                                Mark as Shipped
                            </Button>
                        </form>
                    )}
                    {["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status) && (
                        <form action={handleTransition.bind(null, "CANCELLED")}>
                            <Button size="sm" variant="destructive" className="gap-2">
                                <IconX className="size-4" />
                                Cancel
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Line Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead className="text-right pr-6">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-6 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{item.product_name}</span>
                                                    {item.variant_summary && (
                                                        <span className="text-xs text-muted-foreground">{item.variant_summary}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{item.unit_price} {order.currency}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                {item.line_total_amount} {order.currency}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-semibold">
                                        <TableCell colSpan={3} className="pl-6 text-right">Subtotal</TableCell>
                                        <TableCell className="text-right pr-6">{order.subtotal_amount} {order.currency}</TableCell>
                                    </TableRow>
                                    {order.shipping_amount > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="pl-6 text-right">Shipping</TableCell>
                                            <TableCell className="text-right pr-6">+{order.shipping_amount} {order.currency}</TableCell>
                                        </TableRow>
                                    )}
                                    {order.discount_amount > 0 && (
                                        <TableRow className="text-destructive">
                                            <TableCell colSpan={3} className="pl-6 text-right">Discount</TableCell>
                                            <TableCell className="text-right pr-6">-{order.discount_amount} {order.currency}</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow className="text-lg font-bold">
                                        <TableCell colSpan={3} className="pl-6 text-right">Total</TableCell>
                                        <TableCell className="text-right pr-6">{order.total_amount} {order.currency}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {order.customer_note && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Customer Note</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic text-muted-foreground">"{order.customer_note}"</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <FulfillmentCard
                        shopId={context.shopId}
                        orderId={order.id}
                        orderStatus={order.status}
                        shippingAddress={order.shipping_address}
                        amountToCollect={Number(order.total_amount) || 0}
                        initialConsignments={order.consignments || []}
                        courierAccounts={courierAccountsRes.success ? courierAccountsRes.data : []}
                    />
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconUser className="size-4" />
                                Customer Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="font-medium">{order.customer?.full_name || "Guest"}</p>
                                <p className="text-sm text-muted-foreground">{order.customer?.phone_number}</p>
                                {order.customer?.email && (
                                    <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconMapPin className="size-4" />
                                Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-sm font-sans whitespace-pre-wrap text-muted-foreground">
                                {order.shipping_address || "No address provided."}
                            </pre>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconCreditCard className="size-4" />
                                Payment Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Method</span>
                                <span className="font-medium">{order.payment_method || "N/A"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Currency</span>
                                <span className="font-medium">{order.currency}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
