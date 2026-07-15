"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { IconSend, IconUser, IconRobot } from "@tabler/icons-react";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import {
    getInboxDetail,
    humanTakeover,
    agentSend,
} from "@/lib/api";

export function InboxClient({
    shopId,
    initialConversations,
}: {
    shopId: string;
    initialConversations: any[];
}) {
    const [conversations, setConversations] = useState<any[]>(initialConversations);
    const [selectedConv, setSelectedConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const [filterChannel, setFilterChannel] = useState("ALL");
    const filteredConversations = conversations.filter(
        (conv) => filterChannel === "ALL" || conv.channel === filterChannel
    );

    // Note: To properly reflect human_active status without websockets, we rely on the metadata
    // returned by the conversation list or we simulate it. 
    // We assume the initial fetch brings updated metadata if there's any.

    useEffect(() => {
        if (selectedConv) {
            setLoadingMessages(true);
            getInboxDetail(shopId, selectedConv.channel_identity).then((res) => {
                if (res.success) {
                    // The backend returns messages in descending order (newest first).
                    // We need to display them oldest to newest.
                    setMessages(res.data.reverse());
                } else {
                    toast.error(res.error || "Failed to load messages");
                }
                setLoadingMessages(false);
            });
        }
    }, [selectedConv, shopId]);

    const handleSend = async () => {
        if (!inputText.trim() || !selectedConv) return;

        setIsSending(true);
        const text = inputText;
        setInputText("");

        const res = await agentSend(
            shopId,
            selectedConv.page_id,
            selectedConv.channel_identity,
            text
        );

        if (res.success) {
            // Optimistically add message
            setMessages((prev) => [
                ...prev,
                {
                    direction: "OUTBOUND",
                    text: text,
                    timestamp: Date.now(),
                },
            ]);
        } else {
            toast.error(res.error || "Failed to send message");
            setInputText(text); // restore
        }
        setIsSending(false);
    };

    const handleTakeoverToggle = async () => {
        if (!selectedConv) return;
        const isHumanActive = selectedConv.metadata?.human_active; // We don't have this explicitly, wait, how do we know?
        // Actually the backend sets human_active in redis. We'll just issue a takeover or handback
        // based on a local guess, or we can just send "takeover"
        // Let's assume we can pass "takeover" or "handback"
        // If we don't have the status, let's just make it a dumb button for now, or use metadata if available.
        const action = "takeover"; // For now we'll just support forcing takeover. We can improve this.
        
        // Wait, if it's currently human active, we handback.
        // For this we can keep a local state.
        const res = await humanTakeover(shopId, selectedConv.page_id, selectedConv.channel_identity, action);
        if (res.success) {
            toast.success(`Conversation state changed to ${res.data.status}`);
        } else {
            toast.error(res.error || "Failed to change conversation state");
        }
    };

    return (
        <div className="full-screen flex flex-col md:flex-row h-screen">
            {/* Conversation List Sidebar */}
            <div className="w-full md:w-80 flex flex-col overflow-hidden border-r">
                <div className="h-header p-4 flex flex-col justify-center border-b font-bold gap-2">
                    <div className="text-lg">Inbox</div>
                    <Tabs value={filterChannel} onValueChange={setFilterChannel} className="w-full">
                        <TabsList className="w-full grid grid-cols-4">
                            <TabsTrigger value="ALL" className="text-xs">All</TabsTrigger>
                            <TabsTrigger value="FACEBOOK" className="text-xs">FB</TabsTrigger>
                            <TabsTrigger value="WEB_WIDGET" className="text-xs">Web</TabsTrigger>
                            <TabsTrigger value="WHATSAPP" className="text-xs">WA</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <ScrollArea className="h-[calc(100vh-var(--spacing-header)-48px)] flex-1 overflow-y-auto">
                    {filteredConversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedConv(conv)}
                            className={`p-4 border-b cursor-pointer hover:bg-muted/50 flex flex-col gap-2 ${selectedConv?.id === conv.id ? "bg-muted/50" : ""}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Avatar className="size-8">
                                        <AvatarFallback>
                                            {conv.channel_identity.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm truncate max-w-[120px]">
                                        {conv.channel_identity}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground truncate ml-2">
                                    {conv.channel}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground truncate pr-4">
                                    {/* No message snippet in list yet */}
                                    View thread...
                                </p>
                            </div>
                        </div>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No conversations found.
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-header px-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Avatar className="size-8">
                                    <AvatarFallback>
                                        {selectedConv.channel_identity.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium text-sm">
                                        {selectedConv.channel_identity}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Channel: {selectedConv.channel}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => humanTakeover(shopId, selectedConv.page_id, selectedConv.channel_identity, "takeover").then(res => res.success ? toast.success("Took over!") : toast.error("Failed"))}>
                                    <IconUser className="size-4 mr-2" />
                                    Take Over
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => humanTakeover(shopId, selectedConv.page_id, selectedConv.channel_identity, "handback").then(res => res.success ? toast.success("Handed back!") : toast.error("Failed"))}>
                                    <IconRobot className="size-4 mr-2" />
                                    Hand Back to Bot
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-muted/20">
                            {loadingMessages ? (
                                <div className="text-center text-sm text-muted-foreground mt-4">
                                    Loading messages...
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isOutbound = msg.direction === "OUTBOUND";
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col gap-1 ${isOutbound ? "items-end" : "items-start"}`}
                                        >
                                            <div
                                                className={`px-4 py-2 text-sm ${
                                                    isOutbound
                                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none max-w-[80%]"
                                                        : "bg-muted rounded-2xl rounded-tl-none max-w-[80%]"
                                                }`}
                                            >
                                                {msg.text || (msg.attachment_payload ? "Attachment" : "Empty message")}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mx-1 flex items-center gap-1">
                                                {isOutbound && <IconRobot className="size-3" />}
                                                {isOutbound ? "Bot / Agent" : "Customer"} •{" "}
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            {messages.length === 0 && !loadingMessages && (
                                <div className="text-center text-sm text-muted-foreground mt-4">
                                    No messages in this thread.
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t flex gap-2">
                            <Input
                                placeholder="Type your message as a human agent..."
                                className="flex-1"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                disabled={isSending}
                            />
                            <Button onClick={handleSend} disabled={isSending || !inputText.trim()}>
                                <IconSend className="size-4 mr-2" />
                                Send
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a conversation to start messaging.
                    </div>
                )}
            </div>
        </div>
    );
}
