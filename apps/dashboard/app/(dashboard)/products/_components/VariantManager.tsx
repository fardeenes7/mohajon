"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Switch } from "@repo/ui/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Label } from "@repo/ui/components/ui/label";
import { IconDeviceFloppy, IconPackages } from "@tabler/icons-react";
import { updateVariant, adjustStock } from "@/lib/api";

interface VariantManagerProps {
    shopId: string;
    productId: string;
    initialVariants: any[];
}

export function VariantManager({
    shopId,
    productId,
    initialVariants,
}: VariantManagerProps) {
    const [variants, setVariants] = useState<any[]>(initialVariants || []);
    const [editingVariant, setEditingVariant] = useState<any | null>(null);
    const [stockAdjustModal, setStockAdjustModal] = useState<any | null>(null);

    const handleSaveVariant = async (vid: string, data: any) => {
        try {
            const res = await updateVariant(shopId, productId, vid, data);
            if (res.success) {
                toast.success("Variant updated");
                setVariants((prev) =>
                    prev.map((v) => (v.id === vid ? { ...v, ...res.data } : v))
                );
                setEditingVariant(null);
            } else {
                toast.error(res.error || "Failed to update variant");
            }
        } catch (e) {
            toast.error("Failed to update variant");
        }
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockAdjustModal) return;
        
        const form = e.target as HTMLFormElement;
        const delta = parseInt((form.elements.namedItem("delta") as HTMLInputElement).value, 10);
        const reason = (form.elements.namedItem("reason") as HTMLInputElement).value;

        try {
            const res = await adjustStock(shopId, productId, stockAdjustModal.id, delta, reason);
            if (res.success) {
                toast.success("Stock adjusted");
                setVariants((prev) =>
                    prev.map((v) => (v.id === stockAdjustModal.id ? { ...v, ...res.data } : v))
                );
                setStockAdjustModal(null);
            } else {
                toast.error(res.error || "Failed to adjust stock");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to adjust stock");
        }
    };

    if (variants.length === 0) {
        return <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-muted-foreground">No variants found.</p>
        </div>;
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Attributes</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {variants.map((v) => (
                        <TableRow key={v.id}>
                            <TableCell>
                                {v.attribute_name_1 && `${v.attribute_name_1}: ${v.attribute_value_1}`}
                                {v.attribute_name_2 && ` | ${v.attribute_name_2}: ${v.attribute_value_2}`}
                                {v.attribute_name_3 && ` | ${v.attribute_name_3}: ${v.attribute_value_3}`}
                                {!v.attribute_name_1 && "Default Variant"}
                            </TableCell>
                            <TableCell>
                                {editingVariant?.id === v.id ? (
                                    <Input 
                                        value={editingVariant.sku} 
                                        onChange={(e) => setEditingVariant({...editingVariant, sku: e.target.value})} 
                                        className="h-8"
                                    />
                                ) : (
                                    v.sku
                                )}
                            </TableCell>
                            <TableCell>
                                {editingVariant?.id === v.id ? (
                                    <Input 
                                        type="number"
                                        value={editingVariant.price_override || ""} 
                                        onChange={(e) => setEditingVariant({...editingVariant, price_override: e.target.value})} 
                                        className="h-8 w-24"
                                        placeholder="Base"
                                    />
                                ) : (
                                    v.price_override || "Base"
                                )}
                            </TableCell>
                            <TableCell className="font-mono">
                                {v.stock_quantity}
                            </TableCell>
                            <TableCell>
                                {editingVariant?.id === v.id ? (
                                    <Switch 
                                        checked={editingVariant.is_active} 
                                        onCheckedChange={(c) => setEditingVariant({...editingVariant, is_active: c})} 
                                    />
                                ) : (
                                    v.is_active ? "Active" : "Inactive"
                                )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {editingVariant?.id === v.id ? (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={() => setEditingVariant(null)}>Cancel</Button>
                                        <Button size="sm" onClick={() => handleSaveVariant(v.id, editingVariant)}>
                                            <IconDeviceFloppy className="size-4 mr-2" />
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setEditingVariant(v)}>Edit</Button>
                                        <Button variant="outline" size="sm" onClick={() => setStockAdjustModal(v)}>
                                            <IconPackages className="size-4 mr-2" />
                                            Adjust Stock
                                        </Button>
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Stock Adjust Modal */}
            <Dialog open={!!stockAdjustModal} onOpenChange={(open) => !open && setStockAdjustModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Stock</DialogTitle>
                        <DialogDescription>
                            Current Stock: {stockAdjustModal?.stock_quantity}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdjustStock} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="delta">Quantity to Adjust (+/-)</Label>
                            <Input id="delta" name="delta" type="number" required placeholder="e.g. 5 or -2" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Input id="reason" name="reason" required placeholder="e.g. Restock, Damage, Correction" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setStockAdjustModal(null)}>Cancel</Button>
                            <Button type="submit">Apply Adjustment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
