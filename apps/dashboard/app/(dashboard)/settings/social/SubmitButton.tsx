"use client";

import { useFormStatus } from "react-dom";
import { Button, ButtonProps } from "@repo/ui/components/ui/button";

export function SubmitButton({ children, ...props }: ButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button {...props} type="submit" disabled={pending || props.disabled}>
            {pending ? "Loading..." : children}
        </Button>
    );
}
