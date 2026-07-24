"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";

interface ActiveLinkProps {
    href: string;
    children: React.ReactNode;
    exact?: boolean;
}

export function ActiveLink({ href, children, exact }: ActiveLinkProps) {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
        >
            {children}
        </Link>
    );
}
