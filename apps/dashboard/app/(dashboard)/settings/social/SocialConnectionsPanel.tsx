import { Button } from "@repo/ui/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import { IconBrandMeta } from "@tabler/icons-react";
import type { SocialConnection } from "@repo/api";
import {
    disconnectSocialConnectionAction,
    startSocialOAuthAction,
} from "./actions";
import { ActionForm } from "./ActionForm";

interface SocialConnectionsPanelProps {
    shopId: string;
    initialConnections: SocialConnection[];
}

export function SocialConnectionsPanel({
    shopId,
    initialConnections,
}: SocialConnectionsPanelProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2">
                        <IconBrandMeta className="size-5 text-blue-600 dark:text-blue-500" />
                        Meta Pages
                    </CardTitle>
                    <CardDescription>
                        Connect Facebook and Instagram pages for publishing.
                    </CardDescription>
                </div>
                {initialConnections.length > 0 && (
                    <ActionForm
                        action={startSocialOAuthAction}
                        shopId={shopId}
                        buttonText="Connect Meta Page"
                        variant="outline"
                    />
                )}
            </CardHeader>
            <CardContent>
                {initialConnections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center bg-muted/10">
                        <div className="rounded-full bg-muted p-3">
                            <IconBrandMeta className="size-6 text-muted-foreground" />
                        </div>
                        <div className="max-w-sm space-y-1">
                            <p className="text-sm font-medium">No pages connected</p>
                            <p className="text-sm text-muted-foreground">
                                Connect via Meta OAuth to automatically link your Facebook and Instagram pages.
                            </p>
                        </div>
                        <div className="pt-2">
                            <ActionForm
                                action={startSocialOAuthAction}
                                shopId={shopId}
                                buttonText="Connect with Meta OAuth"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {initialConnections.map((connection) => (
                            <div
                                key={connection.id}
                                className="rounded-lg border bg-muted/40 p-5 shadow-sm space-y-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="font-medium leading-none">
                                            {connection.page_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Page ID: {connection.page_id}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            connection.status === "ACTIVE"
                                                ? "outline"
                                                : "secondary"
                                        }
                                        className={
                                            connection.status === "ACTIVE"
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : ""
                                        }
                                    >
                                        {connection.status}
                                    </Badge>
                                </div>
                                <Separator className="bg-border/60" />
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Token expiry:{" "}
                                        {connection.token_expires_at ??
                                            "Unknown"}
                                    </span>
                                    <form
                                        action={
                                            disconnectSocialConnectionAction
                                        }
                                    >
                                        <input
                                            type="hidden"
                                            name="shopId"
                                            value={shopId}
                                        />
                                        <input
                                            type="hidden"
                                            name="connectionId"
                                            value={connection.id}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="submit"
                                            className="bg-background"
                                        >
                                            Disconnect
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
