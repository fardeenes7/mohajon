"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { IconUser, IconHeadset, IconRobotFace } from "@tabler/icons-react";
import { ChannelIcon, channelMeta } from "../lib/channel";
import type { Conversation } from "../lib/types";

function initials(name: string): string {
    const trimmed = name?.trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function ProfileSidebar({ conversation }: { conversation: Conversation | null }) {
    if (!conversation) {
        return (
            <aside className="hidden w-72 shrink-0 border-l bg-card p-6 xl:flex flex-col items-center justify-center text-center text-muted-foreground">
                <IconUser className="size-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">Customer Profile</p>
                <p className="text-xs opacity-75 mt-1">Select a conversation to view customer details.</p>
            </aside>
        );
    }

    const meta = channelMeta(conversation.channel);
    const profilePic = conversation.profile_pic || (conversation.metadata?.profile_pic || conversation.metadata?.avatar_url) as string | undefined;

    return (
        <aside className="w-72 shrink-0 border-l bg-card flex flex-col h-full overflow-y-auto">
            {/* Header / Avatar */}
            <div className="flex flex-col items-center text-center p-6 border-b">
                <div className="relative mb-3">
                    <Avatar className="size-20 border">
                        {profilePic ? (
                            <AvatarImage src={profilePic} alt={conversation.display_name} />
                        ) : null}
                        <AvatarFallback className="text-xl font-medium">
                            {initials(conversation.display_name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 rounded-full bg-background p-1 ring-2 ring-border">
                        <ChannelIcon channel={conversation.channel} className="size-4" />
                    </span>
                </div>
                
                <h3 className="font-semibold text-base text-foreground truncate max-w-[220px]">
                    {conversation.display_name}
                </h3>
                
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                    {meta.label}
                </p>

                <div className="mt-3 flex items-center justify-center gap-1.5">
                    {conversation.human_active ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                            <IconHeadset className="size-3.5" />
                            Agent Takeover
                        </Badge>
                    ) : conversation.bot_active ? (
                        <Badge variant="outline" className="gap-1 text-xs text-green-600 dark:text-green-500">
                            <IconRobotFace className="size-3.5" />
                            Bot Active
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="gap-1 text-xs">
                            <IconUser className="size-3.5" />
                            Human Mode
                        </Badge>
                    )}
                </div>
            </div>

            {/* Details List */}
            <div className="p-4 flex flex-col gap-4">
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Customer Details
                    </h4>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Channel</span>
                            <span className="font-medium text-foreground">{meta.label}</span>
                        </div>
                        {conversation.page_id ? (
                            <div className="flex justify-between items-center py-1 border-b border-border/50">
                                <span className="text-muted-foreground">Page ID</span>
                                <span className="font-mono text-foreground">{conversation.page_id}</span>
                            </div>
                        ) : null}
                        <div className="flex justify-between items-center py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Sender ID</span>
                            <span className="font-mono text-foreground truncate max-w-[140px]">{conversation.channel_identity}</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
