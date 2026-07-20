"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPurchaseOrder, getProduct, getProducts } from "@/lib/api";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import {
    IconPlus,
    IconTrash,
    IconLoader2,
    IconSearch,
} from "@tabler/icons-react";

type LineItem = {
    variant_id: string;
    product_name: string;
    variant_label: string;
    quantity: string;
    unit_cost: string;
};

type ProductRow = { id: string; name: string; sku: string };

export function CreatePurchaseOrderDialog({
    shopId,
    currency,
    trigger,
}: {
    shopId: string;
    currency: string;
    trigger?: React.ReactNode;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [supplierName, setSupplierName] = useState("");
    const [items, setItems] = useState<LineItem[]>([]);

    const [search, setSearch] = useState("");
    const [results, setResults] = useState<ProductRow[]>([]);
    const [searching, setSearching] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    useEffect(() => {
        if (!open || search.trim() === "") {
            setResults([]);
            return;
        }
        let active = true;
        setSearching(true);
        const timer = setTimeout(async () => {
            const res = await getProducts(shopId, {
                page: 1,
                page_size: 20,
                search: search || undefined,
            });
            if (!active) return;
            if (res.success) setResults(res.data.results as ProductRow[]);
            setSearching(false);
        }, 300);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [shopId, search, open]);

    const addProduct = async (product: ProductRow) => {
        setResolvingId(product.id);
        const res = await getProduct(shopId, product.id);
        setResolvingId(null);
        if (!res.success) {
            toast.error("Could not load product variants.");
            return;
        }
        const variants = (res.data.variants ?? []) as Array<{
            id: string;
            sku: string;
            attribute_value_1?: string;
            attribute_value_2?: string;
        }>;
        const variant = variants[0];
        if (!variant) {
            toast.error("This product has no variants to purchase.");
            return;
        }
        if (items.some((i) => i.variant_id === variant.id)) {
            toast.info("That variant is already in the order.");
            return;
        }
        const label = [variant.attribute_value_1, variant.attribute_value_2]
            .filter(Boolean)
            .join(" / ") || variant.sku || "Default";
        setItems((prev) => [
            ...prev,
            {
                variant_id: variant.id,
                product_name: product.name,
                variant_label: label,
                quantity: "1",
                unit_cost: "0.00",
            },
        ]);
        setSearch("");
        setResults([]);
    };

    const updateItem = (variantId: string, field: "quantity" | "unit_cost", value: string) => {
        setItems((prev) =>
            prev.map((i) => (i.variant_id === variantId ? { ...i, [field]: value } : i)),
        );
    };

    const removeItem = (variantId: string) => {
        setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
    };

    const total = items.reduce(
        (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0),
        0,
    );

    const canSubmit =
        supplierName.trim() !== "" &&
        items.length > 0 &&
        items.every(
            (i) => Number(i.quantity) > 0 && !Number.isNaN(Number(i.unit_cost)) && Number(i.unit_cost) >= 0,
        );

    const reset = () => {
        setSupplierName("");
        setItems([]);
        setSearch("");
        setResults([]);
    };

    const handleSubmit = () => {
        if (!canSubmit) return;
        startTransition(async () => {
            const res = await createPurchaseOrder(shopId, {
                supplier_name: supplierName.trim(),
                total_amount: total.toFixed(2),
                status: "ORDERED",
                items_json: items.map((i) => ({
                    variant_id: i.variant_id,
                    quantity: Number(i.quantity),
                    unit_cost: Number(i.unit_cost),
                })),
            });
            if (res.success) {
                toast.success("Purchase order created.");
                reset();
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Couldn't create the purchase order.");
            }
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) reset();
            }}
        >
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className="gap-2">
                        <IconPlus className="size-4" />
                        Create Purchase Order
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                        Record a supplier order. Marking it received later will update stock and
                        purchase costs.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="grid gap-2">
                        <Label htmlFor="po-supplier">Supplier Name</Label>
                        <Input
                            id="po-supplier"
                            placeholder="e.g. Dhaka Wholesale Ltd."
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="po-search">Add Products</Label>
                        <div className="relative">
                            <IconSearch className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="po-search"
                                className="pl-8"
                                placeholder="Search products by name or SKU"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {(searching || results.length > 0) && (
                            <div className="rounded-md border divide-y">
                                {searching && (
                                    <div className="p-2 text-sm text-muted-foreground">Searching…</div>
                                )}
                                {results.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => addProduct(p)}
                                        disabled={resolvingId === p.id}
                                        className="flex w-full items-center justify-between p-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                                    >
                                        <span>{p.name}</span>
                                        {resolvingId === p.id ? (
                                            <IconLoader2 className="size-4 animate-spin" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">{p.sku}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Line Items</Label>
                            <div className="rounded-md border divide-y">
                                {items.map((item) => (
                                    <div
                                        key={item.variant_id}
                                        className="flex items-center gap-2 p-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {item.product_name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {item.variant_label}
                                            </p>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <Label
                                                htmlFor={`qty-${item.variant_id}`}
                                                className="text-[10px] text-muted-foreground"
                                            >
                                                Qty
                                            </Label>
                                            <Input
                                                id={`qty-${item.variant_id}`}
                                                type="number"
                                                min="1"
                                                step="1"
                                                className="h-8 w-20"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(item.variant_id, "quantity", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-0.5">
                                            <Label
                                                htmlFor={`cost-${item.variant_id}`}
                                                className="text-[10px] text-muted-foreground"
                                            >
                                                Unit Cost
                                            </Label>
                                            <Input
                                                id={`cost-${item.variant_id}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="h-8 w-24"
                                                value={item.unit_cost}
                                                onChange={(e) =>
                                                    updateItem(item.variant_id, "unit_cost", e.target.value)
                                                }
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-destructive"
                                            onClick={() => removeItem(item.variant_id)}
                                            aria-label="Remove item"
                                        >
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 text-sm font-semibold">
                                <span className="text-muted-foreground">Total:</span>
                                <span>
                                    {total.toFixed(2)} {currency}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isPending}
                        className="gap-2"
                    >
                        {isPending && <IconLoader2 className="size-4 animate-spin" />}
                        Create Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
