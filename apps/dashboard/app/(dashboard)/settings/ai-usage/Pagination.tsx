"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface PaginationProps {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export function Pagination({ currentPage, hasNextPage, hasPreviousPage }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-between px-2 py-4 border-t">
            <div className="text-sm text-muted-foreground">
                Page {currentPage}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPreviousPage}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    <IconChevronLeft className="size-4 mr-1" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Next
                    <IconChevronRight className="size-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
