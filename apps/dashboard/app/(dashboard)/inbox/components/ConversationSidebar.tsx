"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { IconSearch, IconPointFilled } from "@tabler/icons-react";
import { cn } from "@repo/ui/lib/utils";
import { useInbox } from "../lib/InboxProvider";
import { ChannelIcon } from "../lib/channel";
import type { Conversation } from "../lib/types";

function initials(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function relativeTime(input: string | number | null): string {
    if (input == null) return "";
    const then = typeof input === "number" ? input : new Date(input).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Date.now() - then;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(then).toLocaleDateString([], { month: "short", day: "numeric" });
}

function snippet(conv: Conversation): string {
    if (!conv.last_message_text) return "No messages yet";
    const prefix = conv.last_message_direction === "OUTBOUND" ? "You: " : "";
    return prefix + conv.last_message_text;
}

function ConversationRow({
    conv,
    active,
}: {
    conv: Conversation;
    active: boolean;
}) {
    return (
        <Link
            href={`/inbox/${conv.id}`}
            className={cn(
                "flex items-center gap-3 px-4 py-3 border-b hover:bg-muted/50 transition-colors",
                active && "bg-muted",
            )}
        >
            <div className="relative shrink-0">
                <Avatar className="size-10">
                    <AvatarFallback className="text-xs">
                        {initials(conv.display_name)}
                    </AvatarFallback>
                </Avatar>
                {/* Channel badge overlapping the avatar. */}
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5 ring-1 ring-border">
                    <ChannelIcon channel={conv.channel} className="size-3.5" />
                </span>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={cn(
                            "truncate text-sm",
                            conv.has_unread ? "font-semibold" : "font-medium",
                        )}
                    >
                        {conv.display_name}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                        {relativeTime(conv.last_message_at ?? conv.updated_at)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p
                        className={cn(
                            "truncate text-xs",
                            conv.has_unread
                                ? "text-foreground"
                                : "text-muted-foreground",
                        )}
                    >
                        {snippet(conv)}
                    </p>
                    {conv.has_unread && conv.unread_count > 0 && (
                        <Badge className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px]">
                            {conv.unread_count > 99 ? "99+" : conv.unread_count}
                        </Badge>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function ConversationSidebar() {
    const { conversations, status } = useInbox();
    const params = useParams<{ conversationId?: string }>();
    const activeId = params?.conversationId;
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter(
            (c) =>
                c.display_name.toLowerCase().includes(q) ||
                c.channel_identity.toLowerCase().includes(q) ||
                (c.last_message_text ?? "").toLowerCase().includes(q),
        );
    }, [conversations, query]);

    return (
        <div className="flex h-full w-full flex-col border-r bg-background md:w-80">
            <div className="flex flex-col gap-3 border-b p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold">Inbox</h1>
                    <span
                        className="flex items-center gap-1 text-[10px] text-muted-foreground"
                        title={
                            status === "open"
                                ? "Live — receiving messages"
                                : status === "connecting"
                                  ? "Connecting…"
                                  : "Disconnected — reconnecting"
                        }
                    >
                        <IconPointFilled
                            className={cn(
                                "size-3",
                                status === "open"
                                    ? "text-green-500"
                                    : status === "connecting"
                                      ? "text-amber-500"
                                      : "text-destructive",
                            )}
                        />
                        {status === "open" ? "Live" : status === "connecting" ? "…" : "Offline"}
                    </span>
                </div>
                <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations"
                        className="pl-8"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                {filtered.map((conv) => (
                    <ConversationRow
                        key={conv.id}
                        conv={conv}
                        active={conv.id === activeId}
                    />
                ))}
                {filtered.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                        {query ? "No matches." : "No conversations yet."}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
