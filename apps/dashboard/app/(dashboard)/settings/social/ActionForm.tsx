"use client";

import { useTransition } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";

interface ActionFormProps {
    action: (formData: FormData) => Promise<{ error?: string } | void>;
    shopId: string;
    buttonText: string;
}

export function ActionForm({ action, shopId, buttonText }: ActionFormProps) {
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
        <form action={handleSubmit}>
            <input type="hidden" name="shopId" value={shopId} />
            <Button type="submit" disabled={isPending}>
                {isPending ? "Loading..." : buttonText}
            </Button>
        </form>
    );
}
