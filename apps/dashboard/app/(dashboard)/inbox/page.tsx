import { IconMessage } from "@tabler/icons-react";

/**
 * Empty state shown at /inbox before a conversation is selected. The sidebar and
 * live socket are provided by the sibling layout, so this pane is purely visual.
 */
export default function InboxIndexPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <IconMessage className="size-7" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">Your conversations</p>
                <p className="text-sm">Select a conversation to start messaging.</p>
            </div>
        </div>
    );
}
