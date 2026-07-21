"use client";

import { use } from "react";
import { IconMessageOff } from "@tabler/icons-react";
import { useInbox } from "../lib/InboxProvider";
import { ConversationThread } from "../components/ConversationThread";

/**
 * Thread pane for a single conversation. The conversation record (channel, psid,
 * page_id, display name) is read from the shared InboxProvider that the layout
 * mounts, so navigating between threads never re-fetches the list or drops the
 * WebSocket. Keyed by id so the thread fully remounts (and reloads history) when
 * switching conversations.
 */
export default function ConversationPage({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) {
    const { conversationId } = use(params);
    const { getConversation } = useInbox();
    const conversation = getConversation(conversationId);

    if (!conversation) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <IconMessageOff className="size-8" />
                <p className="text-sm">This conversation could not be found.</p>
            </div>
        );
    }

    return <ConversationThread key={conversation.id} conversation={conversation} />;
}
