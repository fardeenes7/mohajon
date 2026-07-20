"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select";
import { IconDeviceFloppy, IconArrowLeft } from "@tabler/icons-react";
import { bulkUpdateProducts } from "@/lib/api";

type ProductStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

export type BulkProduct = {
    id: string;
    sku: string | null;
    name: string;
    base_price: string;
    total_stock: number;
    status: ProductStatus;
};

type RowEdit = {
    base_price: string;
    status: ProductStatus;
};

export function BulkEditorClient({
    shopId,
    initialProducts,
}: {
    shopId: string;
    initialProducts: BulkProduct[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [saving, setSaving] = useState(false);

    const baseline = useMemo(() => {
        const map = new Map<string, RowEdit>();
        for (const p of initialProducts) {
            map.set(p.id, { base_price: p.base_price, status: p.status });
        }
        return map;
    }, [initialProducts]);

    const [edits, setEdits] = useState<Map<string, RowEdit>>(
        () => new Map(baseline),
    );

    const setRow = (id: string, patch: Partial<RowEdit>) => {
        setEdits((prev) => {
            const next = new Map(prev);
            const current = next.get(id)!;
            next.set(id, { ...current, ...patch });
            return next;
        });
    };

    const dirtyIds = useMemo(() => {
        const ids: string[] = [];
        for (const [id, edit] of edits) {
            const base = baseline.get(id)!;
            if (
                base.base_price !== edit.base_price ||
                base.status !== edit.status
            ) {
                ids.push(id);
            }
        }
        return ids;
    }, [edits, baseline]);

    const handleDiscard = () => {
        setEdits(new Map(baseline));
        toast.info("Changes discarded.");
    };

    const handleSaveAll = async () => {
        if (dirtyIds.length === 0) {
            toast.info("No changes to save.");
            return;
        }
        setSaving(true);
        const updates = dirtyIds.map((id) => {
            const edit = edits.get(id)!;
            return {
                id,
                base_price: edit.base_price,
                status: edit.status,
            };
        });
        const res = await bulkUpdateProducts(shopId, updates);
        setSaving(false);
        if (res.success) {
            toast.success(
                `Updated ${res.data?.updated_count ?? dirtyIds.length} product(s).`,
            );
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Failed to save changes.");
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <Link
                            href="/products"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <IconArrowLeft className="size-4" />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Bulk Editor
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Mass-edit prices and status for your products. Stock is
                        managed per variant.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleDiscard}
                        disabled={dirtyIds.length === 0 || saving}
                    >
                        Discard Changes
                    </Button>
                    <Button
                        onClick={handleSaveAll}
                        disabled={dirtyIds.length === 0 || saving || isPending}
                    >
                        <IconDeviceFloppy className="size-4 mr-2" />
                        Save All
                        {dirtyIds.length > 0 ? ` (${dirtyIds.length})` : ""}
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">SKU</TableHead>
                            <TableHead className="min-w-[200px]">
                                Product Name
                            </TableHead>
                            <TableHead className="w-[160px]">
                                Base Price
                            </TableHead>
                            <TableHead className="w-[100px]">Stock</TableHead>
                            <TableHead className="w-[160px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialProducts.map((product) => {
                            const edit = edits.get(product.id)!;
                            return (
                                <TableRow key={product.id}>
                                    <TableCell className="font-mono text-xs">
                                        {product.sku || "—"}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {product.name}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={edit.base_price}
                                            onChange={(e) =>
                                                setRow(product.id, {
                                                    base_price: e.target.value,
                                                })
                                            }
                                            className="h-8 w-full tabular-nums"
                                        />
                                    </TableCell>
                                    <TableCell className="tabular-nums text-muted-foreground">
                                        {product.total_stock}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={edit.status}
                                            onValueChange={(v) =>
                                                setRow(product.id, {
                                                    status: v as ProductStatus,
                                                })
                                            }
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DRAFT">
                                                    Draft
                                                </SelectItem>
                                                <SelectItem value="PUBLISHED">
                                                    Published
                                                </SelectItem>
                                                <SelectItem value="SCHEDULED">
                                                    Scheduled
                                                </SelectItem>
                                                <SelectItem value="ARCHIVED">
                                                    Archived
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {initialProducts.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No products yet.{" "}
                                    <Link
                                        href="/products/new"
                                        className="text-primary underline-offset-4 hover:underline"
                                    >
                                        Create one
                                    </Link>
                                    .
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <p className="text-xs text-muted-foreground">
                Showing the {initialProducts.length} most recent products.
            </p>
        </div>
    );
}
