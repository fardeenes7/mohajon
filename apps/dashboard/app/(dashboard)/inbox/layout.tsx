import { getInboxList } from "@/lib/api";
import { requireActiveShopContext } from "@/lib/shop-context";
import { InboxProvider } from "./lib/InboxProvider";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { resolveWsBaseUrl } from "./lib/ws-url";
import type { Conversation } from "./lib/types";

/**
 * Inbox shell. Server-renders auth + the initial conversation list, then hands
 * off to the client InboxProvider which owns the live WebSocket and shared state.
 * The sidebar lives here so it persists across thread navigation
 * (/inbox/[conversationId]) without remounting or dropping the socket.
 */
export default async function InboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const activeShop = await requireActiveShopContext();
    const res = await getInboxList(activeShop.shopId);
    const initialConversations: Conversation[] = res.success ? res.data : [];
    const wsBaseUrl = resolveWsBaseUrl();

    return (
        <div className="full-screen flex h-screen flex-col overflow-hidden md:flex-row">
            <InboxProvider
                shopId={activeShop.shopId}
                wsBaseUrl={wsBaseUrl}
                initialConversations={initialConversations}
            >
                <ConversationSidebar />
                <div className="min-w-0 flex-1">{children}</div>
            </InboxProvider>
        </div>
    );
}
