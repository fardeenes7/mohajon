"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";

export function CopyLinkButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success("Referral link copied to clipboard.");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy. Please copy the link manually.");
        }
    };

    return (
        <Button size="icon" variant="outline" onClick={handleCopy} aria-label="Copy referral link">
            {copied ? <IconCheck size={16} className="text-success" /> : <IconCopy size={16} />}
        </Button>
    );
}
