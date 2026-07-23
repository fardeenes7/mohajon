"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@repo/ui/components/ui/button";

export function SubmitButton({ children, ...props }: React.ComponentProps<typeof Button>) {
    const { pending } = useFormStatus();

    return (
        <Button {...props} type="submit" disabled={pending || props.disabled}>
            {pending ? "Loading..." : children}
        </Button>
    );
}
