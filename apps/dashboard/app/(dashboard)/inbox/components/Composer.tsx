"use client";

import { useRef, useState } from "react";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Button } from "@repo/ui/components/ui/button";
import { IconSend } from "@tabler/icons-react";

/**
 * Message composer. Enter sends, Shift+Enter inserts a newline. The textarea
 * auto-grows up to a cap. `onSend` returns a promise so the input stays disabled
 * until the send resolves and restores the draft if it fails.
 */
export function Composer({
    onSend,
    disabled = false,
}: {
    onSend: (text: string) => Promise<boolean>;
    disabled?: boolean;
}) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);

    const autoGrow = () => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    const submit = async () => {
        const value = text.trim();
        if (!value || sending || disabled) return;
        setSending(true);
        setText("");
        if (ref.current) ref.current.style.height = "auto";
        const ok = await onSend(value);
        if (!ok) setText(value); // restore draft on failure
        setSending(false);
        ref.current?.focus();
    };

    return (
        <div className="flex items-end gap-2 border-t p-4">
            <Textarea
                ref={ref}
                rows={1}
                placeholder={disabled ? "Select a conversation" : "Type a message…"}
                className="max-h-40 min-h-10 flex-1 resize-none"
                value={text}
                disabled={disabled || sending}
                onChange={(e) => {
                    setText(e.target.value);
                    autoGrow();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submit();
                    }
                }}
            />
            <Button
                size="icon"
                onClick={() => void submit()}
                disabled={disabled || sending || !text.trim()}
                aria-label="Send message"
            >
                <IconSend className="size-4" />
            </Button>
        </div>
    );
}
