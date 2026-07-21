import {
    IconBrandMessenger,
    IconBrandWhatsapp,
    IconWorld,
    type Icon,
} from "@tabler/icons-react";
import type { ChatChannel } from "./types";

interface ChannelMeta {
    label: string;
    Icon: Icon;
    /** Tailwind text color for the brand glyph. */
    className: string;
}

const CHANNELS: Record<ChatChannel, ChannelMeta> = {
    FACEBOOK: {
        label: "Messenger",
        Icon: IconBrandMessenger,
        className: "text-[#0084FF]",
    },
    WHATSAPP: {
        label: "WhatsApp",
        Icon: IconBrandWhatsapp,
        className: "text-[#25D366]",
    },
    WEB_WIDGET: {
        label: "Web Chat",
        Icon: IconWorld,
        className: "text-muted-foreground",
    },
};

export function channelMeta(channel: ChatChannel): ChannelMeta {
    return CHANNELS[channel] ?? CHANNELS.WEB_WIDGET;
}

/** Small brand glyph for a channel, colored to the platform. */
export function ChannelIcon({
    channel,
    className = "size-4",
}: {
    channel: ChatChannel;
    className?: string;
}) {
    const meta = channelMeta(channel);
    const { Icon } = meta;
    return (
        <Icon
            className={`${meta.className} ${className}`}
            aria-label={meta.label}
        />
    );
}
