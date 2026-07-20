"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    IconSearch,
    IconBarcode,
    IconShoppingCart,
    IconTrash,
    IconPlus,
    IconMinus,
    IconChevronRight,
    IconLoader2,
} from "@tabler/icons-react";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "sonner";
import { getProducts, getProduct, posCheckout } from "@/lib/api";

interface ProductRow {
    id: string;
    name: string;
    sku: string | null;
    base_price: string;
    thumbnail: string | null;
    total_stock: number;
}

interface CartItem {
    variantId: string;
    productId: string;
    name: string;
    sku: string | null;
    price: number;
    quantity: number;
}

const VAT_RATE = 0.05;

export function PosClient({
    shopId,
    currency,
}: {
    shopId: string;
    currency: string;
}) {
    const router = useRouter();
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [checkingOut, setCheckingOut] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Debounced product search
    useEffect(() => {
        let active = true;
        setLoadingProducts(true);
        const timer = setTimeout(async () => {
            const res = await getProducts(shopId, {
                page: 1,
                page_size: 30,
                status: "PUBLISHED",
                search: searchQuery || undefined,
            });
            if (!active) return;
            if (res.success) {
                setProducts(res.data.results as ProductRow[]);
            }
            setLoadingProducts(false);
        }, 300);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [shopId, searchQuery]);

    // Focus search for barcode scanning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const addToCart = useCallback(
        async (product: ProductRow) => {
            // If already in cart, just bump quantity.
            const existing = cart.find((i) => i.productId === product.id);
            if (existing) {
                setCart((prev) =>
                    prev.map((i) =>
                        i.productId === product.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i,
                    ),
                );
                return;
            }

            // Resolve a sellable variant from the product detail.
            setAddingId(product.id);
            const res = await getProduct(shopId, product.id);
            setAddingId(null);
            if (!res.success) {
                toast.error("Could not load product.");
                return;
            }
            const variants = (res.data.variants ?? []) as Array<{
                id: string;
                is_active: boolean;
                stock_quantity: number;
                effective_price: string;
            }>;
            const variant =
                variants.find((v) => v.is_active && v.stock_quantity > 0) ??
                variants.find((v) => v.is_active);
            if (!variant) {
                toast.error("This product has no sellable variant.");
                return;
            }

            setCart((prev) => [
                ...prev,
                {
                    variantId: variant.id,
                    productId: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: Number(variant.effective_price ?? product.base_price),
                    quantity: 1,
                },
            ]);
        },
        [cart, shopId],
    );

    const updateQuantity = (variantId: string, delta: number) => {
        setCart((prev) =>
            prev.map((i) =>
                i.variantId === variantId
                    ? { ...i, quantity: Math.max(1, i.quantity + delta) }
                    : i,
            ),
        );
    };

    const removeFromCart = (variantId: string) => {
        setCart((prev) => prev.filter((i) => i.variantId !== variantId));
    };

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = subtotal * VAT_RATE;
    const total = subtotal + tax;

    const handleCheckout = async (method: "CASH" | "CARD") => {
        if (cart.length === 0) return;
        setCheckingOut(true);
        const res = await posCheckout(shopId, {
            items: cart.map((i) => ({
                variant_id: i.variantId,
                quantity: i.quantity,
                unit_price: i.price.toFixed(2),
            })),
            payments: [{ method, amount: total.toFixed(2) }],
        });
        setCheckingOut(false);
        if (res.success) {
            toast.success(`Sale completed — ${total.toFixed(2)} ${currency}`);
            setCart([]);
            router.refresh();
        } else {
            toast.error(res.error || "Checkout failed.");
        }
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Left Column: Product Discovery */}
            <div className="flex-1 flex flex-col border-r">
                <header className="h-header flex items-center px-4 border-b gap-4 bg-card/50">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search products or scan barcode (Ctrl+F)..."
                            className="pl-10 h-11 bg-background shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border bg-muted text-[10px] font-medium text-muted-foreground">
                            <IconBarcode className="size-3" />
                            SCANNER ACTIVE
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4">
                    {loadingProducts ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <IconLoader2 className="size-6 animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-2">
                            <IconSearch className="size-10 stroke-1" />
                            <p className="text-sm">No products found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {products.map((product) => (
                                <Card
                                    key={product.id}
                                    className="py-0 group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden border-border/50"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="aspect-square bg-muted relative">
                                        {product.thumbnail && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.thumbnail}
                                                alt={product.name}
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                        {addingId === product.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                                                <IconLoader2 className="size-5 animate-spin" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2">
                                            <Badge
                                                variant="secondary"
                                                className="bg-white/90 dark:bg-black/90 backdrop-blur shadow-sm"
                                            >
                                                {Number(product.base_price).toFixed(0)} {currency}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-3">
                                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {product.sku || "No SKU"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Cart & Checkout */}
            <div className="w-[400px] flex flex-col bg-card shadow-2xl z-10 border-l">
                <header className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconShoppingCart className="size-5" />
                        <h2 className="font-bold tracking-tight text-lg">
                            Current Order
                        </h2>
                    </div>
                    <Badge
                        variant="outline"
                        className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
                    >
                        {cart.length} Items
                    </Badge>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                            <IconShoppingCart className="size-16 stroke-1" />
                            <p className="text-sm font-medium">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.variantId}
                                className="flex gap-3 group"
                            >
                                <div className="size-12 rounded bg-muted shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-medium truncate">
                                            {item.name}
                                        </h4>
                                        <span className="text-sm font-bold">
                                            {(item.price * item.quantity).toFixed(0)} {currency}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-6 rounded-full"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.variantId,
                                                        -1,
                                                    )
                                                }
                                            >
                                                <IconMinus className="size-3" />
                                            </Button>
                                            <span className="w-8 text-center text-xs font-medium">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-6 rounded-full"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.variantId,
                                                        1,
                                                    )
                                                }
                                            >
                                                <IconPlus className="size-3" />
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={() =>
                                                removeFromCart(item.variantId)
                                            }
                                        >
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <footer className="p-4 bg-muted/30 border-t space-y-4">
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{subtotal.toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>VAT (5%)</span>
                            <span>{tax.toFixed(2)} {currency}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary">
                                {total.toFixed(2)} {currency}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="h-14 gap-1 flex-col items-center justify-center py-0"
                            disabled={cart.length === 0 || checkingOut}
                            onClick={() => handleCheckout("CASH")}
                        >
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                                Cash
                            </span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 gap-1 flex-col items-center justify-center py-0"
                            disabled={cart.length === 0 || checkingOut}
                            onClick={() => handleCheckout("CARD")}
                        >
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                                Card
                            </span>
                        </Button>
                    </div>

                    <Button
                        className="w-full h-14 text-lg font-bold gap-2 shadow-lg shadow-primary/20"
                        disabled={cart.length === 0 || checkingOut}
                        onClick={() => handleCheckout("CASH")}
                    >
                        {checkingOut ? (
                            <IconLoader2 className="size-5 animate-spin" />
                        ) : (
                            <>
                                PAY {total.toFixed(2)} {currency}
                                <IconChevronRight className="size-5" />
                            </>
                        )}
                    </Button>
                </footer>
            </div>
        </div>
    );
}
