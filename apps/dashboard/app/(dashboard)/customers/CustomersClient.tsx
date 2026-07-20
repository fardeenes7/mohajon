"use client";

import { useState } from "react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import { IconSearch, IconLoader2, IconUserSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { searchCustomerByPhone } from "@/lib/api";
import { CustomerProfileSheet } from "./CustomerProfileSheet";
import type { CustomerSearchResult } from "./types";

export function CustomersClient({ shopId }: { shopId: string }) {
    const [phone, setPhone] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [result, setResult] = useState<CustomerSearchResult | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = phone.trim();
        if (!trimmed) return;

        setIsSearching(true);
        setSearched(false);
        const res = await searchCustomerByPhone(shopId, trimmed);
        setIsSearching(false);
        setSearched(true);

        if (res.success) {
            setResult(res.data as CustomerSearchResult);
        } else if (res.status === 404) {
            setResult(null);
        } else {
            setResult(null);
            toast.error(res.error || "Search failed. Please try again.");
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by phone number (e.g. 01712345678)"
                        className="pl-9"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                <Button type="submit" disabled={isSearching || !phone.trim()} className="gap-2">
                    {isSearching ? (
                        <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                        <IconSearch className="size-4" />
                    )}
                    Search
                </Button>
            </form>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Phone</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Trust Score</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {result ? (
                            <TableRow>
                                <TableCell className="font-medium">{result.phone}</TableCell>
                                <TableCell>
                                    <Badge variant={result.is_verified ? "success" : "outline"}>
                                        {result.is_verified ? "Verified" : "Unverified"}
                                    </Badge>
                                </TableCell>
                                <TableCell>{result.trust_score}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedUserId(result.user_id)}
                                    >
                                        View Profile
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    {!searched ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <IconUserSearch className="size-8 opacity-40" />
                                            <span>Enter a phone number to look up a customer.</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <IconUserSearch className="size-8 opacity-40" />
                                            <span>No customer found for that phone number.</span>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <CustomerProfileSheet
                shopId={shopId}
                userId={selectedUserId}
                open={!!selectedUserId}
                onOpenChange={(open) => {
                    if (!open) setSelectedUserId(null);
                }}
            />
        </div>
    );
}
