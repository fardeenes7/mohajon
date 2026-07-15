"use client";

import { useState, useEffect } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";
import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import { Separator } from "@repo/ui/components/ui/separator";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Switch } from "@repo/ui/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@repo/ui/components/ui/select";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldGroup,
    FieldError
} from "@repo/ui/components/ui/field";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    productSchema,
    type ProductFormValues
} from "../_schemas/productSchema";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUploader } from "./ImageUploader";
import { VariantMatrix } from "./VariantMatrix";
import { VariantManager } from "./VariantManager";
import { ProductAIPrompter } from "./ProductAIPrompter";
import { ProductAIImageGen } from "./ProductAIImageGen";
import { SpecificationsEditor } from "./SpecificationsEditor";
import {
    createProduct,
    updateProduct,
    createVariant,
    updateVariant
} from "@/lib/api";
import type { Category, ProductDetail } from "@repo/api";

interface ProductFormProps {
    shopId: string;
    categories: Category[];
    initialData?: ProductDetail;
    mode: "create" | "edit";
}

export function ProductForm({
    shopId,
    categories,
    initialData,
    mode
}: ProductFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [variantRows, setVariantRows] = useState<unknown[]>([]);

    const {
        handleSubmit,
        control,
        formState: { isDirty },
        watch,
        setValue
    } = useForm<ProductFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: standardSchemaResolver(productSchema) as any,
        defaultValues: initialData
            ? {
                  name: initialData.name,
                  slug: initialData.slug,
                  category_id: initialData.category?.id ?? null,
                  description: initialData.description,
                  status: initialData.status as ProductFormValues["status"],
                  base_price: initialData.base_price,
                  compare_at_price: initialData.compare_at_price ?? null,
                  tax_rate: initialData.tax_rate,
                  sku: initialData.sku,
                  weight_grams: initialData.weight_grams ?? null,
                  is_digital: initialData.is_digital,
                  seo_title: initialData.seo_title,
                  seo_description: initialData.seo_description,
                  sort_order: initialData.sort_order,
                  publish_at: initialData.publish_at ?? null,
                  specifications: initialData.specifications ?? {},
                  stock_quantity: initialData.variants?.[0]?.stock_quantity ?? 0,
                  media_ids: initialData.product_media?.map((pm) => pm.media.id) ?? []
              }
            : {
                  name: "",
                  description: "",
                  status: "DRAFT",
                  base_price: "",
                  tax_rate: "0",
                  is_digital: false,
                  specifications: {},
                  seo_title: "",
                  seo_description: "",
                  sort_order: 0,
                  publish_at: null,
                  stock_quantity: 0,
                  media_ids: []
              }
    });

    const watchedName = watch("name");
    const watchedStatus = watch("status");

    // Detect if this should be treated as a "Simple Product" (no variants)
    const shouldShowSimpleStock =
        mode === "create"
            ? variantRows.length === 0
            : (initialData?.variants?.length ?? 0) <= 1 &&
              !initialData?.variants?.[0]?.attribute_name_1;

    const onSubmit = async (data: unknown) => {
        const formData = data as ProductFormValues;
        if (formData.status !== "SCHEDULED") {
            formData.publish_at = null;
        }
        setIsSubmitting(true);
        try {
            let result;
            if (mode === "create") {
                result = await createProduct(shopId, formData);

                if (result.success) {
                    const product = result.data;

                    // Handle Variants
                    if (variantRows.length > 0) {
                        // Multiple Variants
                        const variantErrors: string[] = [];
                        for (const row of variantRows as any[]) {
                            const vRes = await createVariant(
                                shopId,
                                product.id,
                                row
                            );
                            if (!vRes.success) variantErrors.push(vRes.error);
                        }
                        if (variantErrors.length > 0) {
                            toast.error(
                                `Product saved, but ${variantErrors.length} variant(s) failed.`
                            );
                        }
                    } else {
                        // Single Default Variant
                        await createVariant(shopId, product.id, {
                            sku: formData.sku || "",
                            stock_quantity: formData.stock_quantity,
                            price_override: null,
                            is_active: true
                        });
                    }
                }
            } else if (mode === "edit" && initialData) {
                result = await updateProduct(shopId, initialData.id, formData);

                if (result.success && shouldShowSimpleStock) {
                    // Update the default variant stock if it's a simple product
                    const defaultVariant = initialData.variants?.[0];
                    if (defaultVariant) {
                        await updateVariant(
                            shopId,
                            initialData.id,
                            defaultVariant.id,
                            {
                                sku: formData.sku || "",
                                stock_quantity: formData.stock_quantity
                            }
                        );
                    } else {
                        // If for some reason there's no variant, create one
                        await createVariant(shopId, initialData.id, {
                            sku: formData.sku || "",
                            stock_quantity: formData.stock_quantity,
                            price_override: null,
                            is_active: true
                        });
                    }
                }
            }

            if (!result || !result.success) {
                toast.error(result?.error || "Failed to save product.");
                return;
            }

            const product = result.data;

            toast.success(
                mode === "create"
                    ? `"${product.name}" created successfully!`
                    : `"${product.name}" updated.`
            );
            router.push("/products");
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6 pb-12 container"
        >
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6" />
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                {mode === "create"
                                    ? "New Product"
                                    : watchedName || "Edit Product"}
                            </h1>
                            {isDirty && (
                                <Badge
                                    variant="outline"
                                    className="animate-pulse bg-amber-50 text-amber-700 border-amber-200 gap-1 hidden sm:flex"
                                >
                                    <span className="size-1.5 rounded-full bg-amber-500" />
                                    Unsaved Changes
                                </Badge>
                            )}
                        </div>
                        {initialData && (
                            <div className="flex items-center gap-2 mt-1">
                                <Badge
                                    variant="outline"
                                    className="font-mono text-[10px] h-4 px-1 opacity-70"
                                >
                                    ID: {initialData.id.split("-")[0]}...
                                </Badge>
                                {initialData.sku && (
                                    <Badge
                                        variant="secondary"
                                        className="font-mono text-[10px] h-4 px-1 opacity-70"
                                    >
                                        SKU: {initialData.sku}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? (
                            <IconLoader2 className="size-4 animate-spin mr-2" />
                        ) : (
                            <IconDeviceFloppy className="size-4 mr-2" />
                        )}
                        {mode === "create" ? "Create Product" : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: main product details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info */}
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                Product Name *
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                id={field.name}
                                                placeholder="e.g. Classic Cotton T-Shirt"
                                                className="text-lg h-12"
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <div className="flex items-center justify-between mb-2">
                                                <FieldLabel htmlFor={field.name}>
                                                    Description
                                                </FieldLabel>
                                                <ProductAIPrompter
                                                    shopId={shopId}
                                                    productName={watchedName}
                                                    specifications={watch("specifications") || {}}
                                                    onGenerate={(desc) =>
                                                        setValue("description", desc, {
                                                            shouldDirty: true
                                                        })
                                                    }
                                                />
                                            </div>
                                            <RichTextEditor
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Media</CardTitle>
                                    <CardDescription className="mt-1">
                                        First image is the primary thumbnail.
                                    </CardDescription>
                                </div>
                                <ProductAIImageGen
                                    shopId={shopId}
                                    productName={watchedName}
                                    onImageGenerated={(mediaId) => {
                                        const currentIds = watch("media_ids") || [];
                                        setValue("media_ids", [...currentIds, mediaId], { shouldDirty: true });
                                    }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ImageUploader
                                shopId={shopId}
                                value={watch("media_ids") || []}
                                initialImages={initialData?.product_media?.map((pm) => ({
                                    id: pm.media.id,
                                    cdnUrl: pm.media.cdn_url,
                                    filename: pm.media.original_filename || "image",
                                    status: "done" as const
                                }))}
                                onChange={(ids) => setValue("media_ids", ids, { shouldDirty: true })}
                                maxImages={10}
                            />
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Controller
                                    name="base_price"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                Base Price (BDT) *
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                id={field.name}
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="compare_at_price"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                Compare-at Price
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                id={field.name}
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="Original price"
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                            </div>
                            
                            <Controller
                                name="tax_rate"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={!!fieldState.error}>
                                        <FieldLabel htmlFor={field.name}>
                                            Tax Rate (%)
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            value={field.value ?? "0"}
                                            id={field.name}
                                            type="number"
                                            min={0}
                                            max={1}
                                            step="0.01"
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Inventory */}
                    {shouldShowSimpleStock && (
                        <Card className="shadow-sm border-muted/60">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Inventory</CardTitle>
                                <CardDescription>
                                    Manage availability for this simple product.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Controller
                                        name="stock_quantity"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={!!fieldState.error}>
                                                <FieldLabel htmlFor={field.name}>
                                                    Stock Quantity
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? 0}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    id={field.name}
                                                    type="number"
                                                    min={0}
                                                />
                                                <FieldError errors={[fieldState.error]} />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name="sku"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={!!fieldState.error}>
                                                <FieldLabel htmlFor={field.name}>
                                                    SKU (Stock Keeping Unit)
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    id={field.name}
                                                    placeholder="Unique identifier"
                                                />
                                                <FieldError errors={[fieldState.error]} />
                                            </Field>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Shipping */}
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Shipping</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Controller
                                name="is_digital"
                                control={control}
                                render={({ field }) => (
                                    <Field className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Digital Product</FieldLabel>
                                            <FieldDescription>No physical shipping required.</FieldDescription>
                                        </div>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </Field>
                                )}
                            />

                            {!watch("is_digital") && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Controller
                                        name="weight_grams"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={!!fieldState.error}>
                                                <FieldLabel htmlFor={field.name}>
                                                    Weight (grams)
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    id={field.name}
                                                    type="number"
                                                />
                                            </Field>
                                        )}
                                    />
                                    <div className="space-y-2">
                                        <FieldLabel>Dimensions (L × W × H)</FieldLabel>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Controller
                                                name="length_cm"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input {...field} value={field.value ?? ""} placeholder="L" type="number" />
                                                )}
                                            />
                                            <Controller
                                                name="width_cm"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input {...field} value={field.value ?? ""} placeholder="W" type="number" />
                                                )}
                                            />
                                            <Controller
                                                name="height_cm"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input {...field} value={field.value ?? ""} placeholder="H" type="number" />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Variants */}
                    <Card className="shadow-sm border-muted/60" id="variants">
                        <CardHeader>
                            <CardTitle>Variants</CardTitle>
                            <CardDescription>
                                Define attributes like Size or Color to create multiple variations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mode === "create" ? (
                                <VariantMatrix onVariantsGenerated={setVariantRows} />
                            ) : (
                                <VariantManager shopId={shopId} productId={initialData!.id} initialVariants={initialData?.variants || []} />
                            )}
                        </CardContent>
                    </Card>

                    {/* Specifications */}
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader>
                            <CardTitle>Specifications</CardTitle>
                            <CardDescription>
                                Add technical details, materials, or custom key-value pairs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Controller
                                name="specifications"
                                control={control}
                                render={({ field }) => (
                                    <SpecificationsEditor value={field.value} onChange={field.onChange} />
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* SEO */}
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader>
                            <CardTitle>Search Engine Optimization</CardTitle>
                            <CardDescription>
                                Optimize how your product appears in search results.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
                                <Controller
                                    name="seo_title"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                SEO Title
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    {field.value?.length ?? 0} / 120
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                id={field.name}
                                                placeholder="Leave blank to use product name"
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="seo_description"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                Meta Description
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    {field.value?.length ?? 0} / 320
                                                </span>
                                            </FieldLabel>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ""}
                                                id={field.name}
                                                placeholder="Brief summary for search results..."
                                                rows={4}
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="slug"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                URL Slug
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                id={field.name}
                                                placeholder="auto-generated-from-name"
                                            />
                                            <FieldDescription>
                                                The URL path for this product.
                                            </FieldDescription>
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                            </FieldGroup>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: operational settings */}
                <div className="space-y-8">
                    {/* Status Card */}
                    <div className="sticky top-20 space-y-8">
                        <Card className="shadow-sm border-l-4 border-l-primary/40">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Publishing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger id={field.name} className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                                    <SelectItem value="PUBLISHED">Published</SelectItem>
                                                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />

                                {watchedStatus === "SCHEDULED" && (
                                    <Controller
                                        name="publish_at"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={!!fieldState.error}>
                                                <FieldLabel htmlFor={field.name}>
                                                    Schedule For
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    type="datetime-local"
                                                    value={field.value ?? ""}
                                                />
                                                <FieldError errors={[fieldState.error]} />
                                            </Field>
                                        )}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Organization Card */}
                        <Card className="shadow-sm border-muted/60">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Organization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Controller
                                    name="category_id"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                Category
                                            </FieldLabel>
                                            <Select
                                                value={field.value ?? "__none__"}
                                                onValueChange={(v) =>
                                                    field.onChange(v === "__none__" ? null : v)
                                                }
                                            >
                                                <SelectTrigger id={field.name}>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">Uncategorized</SelectItem>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="sort_order"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                            <FieldLabel htmlFor={field.name}>
                                                Sort Order
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                value={field.value ?? 0}
                                                onChange={(e) =>
                                                    field.onChange(parseInt(e.target.value) || 0)
                                                }
                                                id={field.name}
                                                type="number"
                                                min={0}
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </form>
    );
}
