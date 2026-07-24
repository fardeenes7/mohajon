"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

interface DateFilterProps {
    defaultStartDate: string;
    defaultEndDate: string;
}

export function DateFilter({ defaultStartDate, defaultEndDate }: DateFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentStartDate = searchParams.get("start_date") || defaultStartDate;
    const currentEndDate = searchParams.get("end_date") || defaultEndDate;

    const handleDateChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page"); // Reset page on filter change
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <Label htmlFor="start_date" className="text-sm font-medium">From</Label>
                <Input
                    id="start_date"
                    type="date"
                    value={currentStartDate}
                    onChange={(e) => handleDateChange("start_date", e.target.value)}
                    className="h-8 w-[140px]"
                />
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="end_date" className="text-sm font-medium">To</Label>
                <Input
                    id="end_date"
                    type="date"
                    value={currentEndDate}
                    onChange={(e) => handleDateChange("end_date", e.target.value)}
                    className="h-8 w-[140px]"
                />
            </div>
        </div>
    );
}
