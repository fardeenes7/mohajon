import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProductSocialActivity } from "@/lib/api";
import { requireActiveShopContext } from "@/lib/shop-context";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import {
    IconArrowLeft,
    IconEdit,
    IconPackage,
    IconTag,
    IconScale,
    IconRuler2,
    IconWorld,
    IconSparkles,
    IconLayersIntersect,
    IconShare,
    IconBuildingStore,
} from "@tabler/icons-react";
import { ProductStatusBadge } from "../_components/ProductStatusBadge";
import { EmbeddingStatusBadge } from "../_components/EmbeddingStatusBadge";
import { ProductSocialTimeline } from "../_components/ProductSocialTimeline";
import type { ProductVariant } from "@repo/api";

interface ProductDetailsPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params
}: ProductDetailsPageProps): Promise<Metadata> {
    const activeShop = await requireActiveShopContext();
    const { id } = await params;
    const res = await getProduct(activeShop.shopId, id);
    if (!res.success) return { title: "Product Details | Mohajon Dashboard" };
    return {
        title: `${res.data.name} | Product Details | Mohajon Dashboard`
    };
}

function formatCurrency(amount: string | number, currency: string = "BDT") {
    const val = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(val)) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
    }).format(val);
}

export default async function ProductDetailsPage({
    params
}: ProductDetailsPageProps) {
    const activeShop = await requireActiveShopContext();
    const { id } = await params;

    const [productRes, socialLogsRes] = await Promise.all([
        getProduct(activeShop.shopId, id),
        getProductSocialActivity(activeShop.shopId, id),
    ]);

    if (!productRes.success) notFound();

    const product = productRes.data;
    const socialLogs = socialLogsRes.success ? socialLogsRes.data : [];

    const mainThumbnail =
        product.product_media?.find((m: { is_thumbnail: boolean; media?: { cdn_url: string } }) => m.is_thumbnail)?.media?.cdn_url ||
        product.product_media?.[0]?.media?.cdn_url ||
        product.thumbnail;

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
            {/* ── Top Bar / Header ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="size-9" asChild>
                        <Link href="/products">
                            <IconArrowLeft className="size-4" />
                            <span className="sr-only">Back to products</span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                            <ProductStatusBadge status={product.status} />
                            <EmbeddingStatusBadge status={product.vector_status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>SKU: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">{product.sku || "N/A"}</code></span>
                            <span>•</span>
                            <span>Category: <strong className="text-foreground">{product.category?.name || product.category_name || "Uncategorized"}</strong></span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/products/${product.id}/edit`}>
                            <IconEdit className="size-4 mr-1.5" />
                            Edit Product
                        </Link>
                    </Button>
                </div>
            </div>

            {/* ── Key Metrics Overview Cards ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base Price</p>
                            <h3 className="text-xl font-bold mt-1">{formatCurrency(product.base_price, activeShop.baseCurrency)}</h3>
                            {product.compare_at_price && (
                                <p className="text-xs text-muted-foreground line-through">
                                    {formatCurrency(product.compare_at_price, activeShop.baseCurrency)}
                                </p>
                            )}
                        </div>
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <IconTag className="size-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Stock</p>
                            <h3 className={`text-xl font-bold mt-1 ${product.total_stock === 0 ? "text-destructive" : ""}`}>
                                {product.total_stock} units
                            </h3>
                            <p className="text-xs text-muted-foreground">Across all variants</p>
                        </div>
                        <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <IconPackage className="size-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">RAG AI Vector</p>
                            <div className="mt-1">
                                <EmbeddingStatusBadge status={product.vector_status} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Chatbot knowledge state</p>
                        </div>
                        <div className="size-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <IconSparkles className="size-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variants</p>
                            <h3 className="text-xl font-bold mt-1">{product.variants?.length || 1} SKU(s)</h3>
                            <p className="text-xs text-muted-foreground">{product.is_digital ? "Digital Item" : "Physical Item"}</p>
                        </div>
                        <div className="size-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <IconLayersIntersect className="size-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Main Content Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left Column: Media & Specifications & RAG Context ───── */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Media Gallery Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconBuildingStore className="size-4 text-primary" />
                                Product Images
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {mainThumbnail ? (
                                <div className="flex flex-col gap-4">
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border">
                                        <Image
                                            src={mainThumbnail}
                                            alt={product.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    {product.product_media && product.product_media.length > 1 && (
                                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                            {product.product_media.map((pm: { id: string; is_thumbnail: boolean; media: { cdn_url: string } }) => (
                                                <div
                                                    key={pm.id}
                                                    className={`relative size-16 rounded-md overflow-hidden bg-muted border shrink-0 ${pm.is_thumbnail ? "ring-2 ring-primary" : ""}`}
                                                >
                                                    <Image
                                                        src={pm.media.cdn_url}
                                                        alt="Product media"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-40 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground text-sm">
                                    No images attached to this product
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs for Overview, Specifications, RAG AI Vector Data */}
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-1">
                                Overview & Description
                            </TabsTrigger>
                            <TabsTrigger value="variants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-1">
                                Variants ({product.variants?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="rag" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-1">
                                RAG AI Knowledge Info
                            </TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {product.description ? (
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No detailed description provided.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Variants Tab */}
                        <TabsContent value="variants" className="pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Product Variants</CardTitle>
                                    <CardDescription>Available purchasable SKUs and stock breakdown</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {product.variants && product.variants.length > 0 ? (
                                        <div className="rounded-md border overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Attributes</TableHead>
                                                        <TableHead className="text-right">Price Override</TableHead>
                                                        <TableHead className="text-right">Effective Price</TableHead>
                                                        <TableHead className="text-right">Stock</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {product.variants.map((v: ProductVariant) => (
                                                        <TableRow key={v.id}>
                                                            <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                                                            <TableCell className="text-xs font-medium">
                                                                {[
                                                                    v.attribute_name_1 && `${v.attribute_name_1}: ${v.attribute_value_1}`,
                                                                    v.attribute_name_2 && `${v.attribute_name_2}: ${v.attribute_value_2}`,
                                                                ].filter(Boolean).join(" / ") || "Default"}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums text-xs">
                                                                {v.price_override ? formatCurrency(v.price_override, activeShop.baseCurrency) : "—"}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums text-xs font-bold">
                                                                {formatCurrency(v.effective_price, activeShop.baseCurrency)}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums text-xs">
                                                                <span className={v.stock_quantity === 0 ? "text-destructive font-bold" : ""}>
                                                                    {v.stock_quantity}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Single product with no variants.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* RAG Knowledge Tab */}
                        <TabsContent value="rag" className="pt-4">
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <IconSparkles className="size-4 text-primary" />
                                            RAG Chatbot Knowledge Chunk
                                        </CardTitle>
                                        <EmbeddingStatusBadge status={product.vector_status} />
                                    </div>
                                    <CardDescription>
                                        This exact text representation is converted into a 1536-dimensional vector embedding for Messenger & RAG customer support queries.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <div className="bg-background rounded-lg p-4 border font-mono text-xs text-foreground space-y-2 whitespace-pre-wrap">
                                        <p><strong>Product Name:</strong> {product.name}</p>
                                        <p><strong>Description:</strong> {product.description.replace(/<[^>]*>?/gm, '') || "N/A"}</p>
                                        <p><strong>Price:</strong> {formatCurrency(product.base_price, activeShop.baseCurrency)}</p>
                                        <p><strong>Specs:</strong></p>
                                        {product.specifications && Object.keys(product.specifications).length > 0 ? (
                                            <ul className="list-disc list-inside pl-2 space-y-1">
                                                {Object.entries(product.specifications).map(([k, v]) => (
                                                    <li key={k}><span>{k}:</span> {String(v)}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted-foreground pl-2">No custom specs</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* ── Right Column: Specs & Social Activity Timeline ─────── */}
                <div className="flex flex-col gap-6">
                    {/* Specifications Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconRuler2 className="size-4 text-primary" />
                                Specifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 text-sm">
                            {product.weight_grams && (
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <IconScale className="size-3.5" /> Weight
                                    </span>
                                    <span className="font-medium">{product.weight_grams} g</span>
                                </div>
                            )}
                            {(product.length_cm || product.width_cm || product.height_cm) && (
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <IconRuler2 className="size-3.5" /> Dimensions
                                    </span>
                                    <span className="font-medium">
                                        {[product.length_cm, product.width_cm, product.height_cm].filter(Boolean).join(" × ")} cm
                                    </span>
                                </div>
                            )}

                            {product.specifications && Object.keys(product.specifications).length > 0 ? (
                                Object.entries(product.specifications).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground">{key}</span>
                                        <span className="font-medium text-right">{String(val)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No extra custom specs defined.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* SEO Meta Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconWorld className="size-4 text-primary" />
                                SEO Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                {product.seo_title || product.name}
                            </h4>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                                https://{activeShop.shopId}.mohajon.io/products/{product.slug}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {product.seo_description || product.description.replace(/<[^>]*>?/gm, '') || "No SEO description set."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Social Timeline Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconShare className="size-4 text-primary" />
                                Social Activity Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProductSocialTimeline items={socialLogs} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
