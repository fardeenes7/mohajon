"use client";

import { useTransition } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";

interface ActionFormProps {
    action: (formData: FormData) => Promise<{ error?: string } | void>;
    shopId: string;
    buttonText: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    children?: React.ReactNode;
}

export function ActionForm({ action, shopId, buttonText, variant = "default", children }: ActionFormProps) {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            try {
                const result = await action(formData);
                if (result?.error) {
                    toast.error(result.error);
                }
            } catch (err: any) {
                // Ignore redirect errors which are handled by Next.js
                if (err?.message !== "NEXT_REDIRECT") {
                    toast.error(err?.message || "Something went wrong.");
                }
            }
        });
    };

    return (
        <form action={handleSubmit} className="flex items-center gap-3">
            <input type="hidden" name="shopId" value={shopId} />
            {children}
            <Button type="submit" variant={variant} disabled={isPending}>
                {isPending ? "Loading..." : buttonText}
            </Button>
        </form>
    );
}
