"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@repo/ui/components/ui/empty";
import {
    IconKey,
    IconPlus,
    IconWebhook,
    IconTrash,
    IconCopy,
    IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
    getApiTokens,
    createApiToken,
    revokeApiToken,
    getWebhooks,
    registerWebhook,
    deleteWebhook,
} from "@/lib/api";

type ApiToken = {
    id: string;
    name: string;
    token_prefix: string;
    scopes: string[];
    expires_at: string | null;
    last_used_at: string | null;
    created_at: string;
};

type Webhook = {
    id: string;
    url: string;
    status: string;
    status_display: string;
    subscribed_events: string[];
    last_triggered_at: string | null;
    last_success_at: string | null;
};

const WEBHOOK_EVENTS = ["order.created", "order.updated", "order.shipped"];

function formatDate(value: string | null) {
    if (!value) return "Never";
    return new Date(value).toLocaleDateString();
}

export function DeveloperApiClient({ shopId }: { shopId: string }) {
    const [tokens, setTokens] = useState<ApiToken[]>([]);
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);

    // token dialog
    const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
    const [tokenName, setTokenName] = useState("");
    const [creatingToken, setCreatingToken] = useState(false);
    const [rawToken, setRawToken] = useState<string | null>(null);

    // webhook dialog
    const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [creatingWebhook, setCreatingWebhook] = useState(false);

    const refresh = useCallback(async () => {
        const [tokenRes, webhookRes] = await Promise.all([
            getApiTokens(shopId),
            getWebhooks(shopId),
        ]);
        if (tokenRes.success) setTokens(tokenRes.data);
        if (webhookRes.success) setWebhooks(webhookRes.data);
        setLoading(false);
    }, [shopId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleCreateToken = async () => {
        if (!tokenName.trim()) {
            toast.error("Give your token a name.");
            return;
        }
        setCreatingToken(true);
        const res = await createApiToken(shopId, {
            name: tokenName.trim(),
            scopes: [],
        });
        setCreatingToken(false);
        if (res.success) {
            setRawToken(res.data.raw_token ?? null);
            setTokenName("");
            toast.success("API token generated.");
            refresh();
        } else {
            toast.error(res.error || "Failed to generate token.");
        }
    };

    const handleRevokeToken = async (tokenId: string) => {
        const res = await revokeApiToken(shopId, tokenId);
        if (res.success) {
            setTokens((prev) => prev.filter((t) => t.id !== tokenId));
            toast.success("Token revoked.");
        } else {
            toast.error(res.error || "Failed to revoke token.");
        }
    };

    const handleCreateWebhook = async () => {
        if (!webhookUrl.trim()) {
            toast.error("Enter a webhook URL.");
            return;
        }
        if (selectedEvents.length === 0) {
            toast.error("Select at least one event.");
            return;
        }
        setCreatingWebhook(true);
        const res = await registerWebhook(shopId, {
            url: webhookUrl.trim(),
            subscribed_events: selectedEvents,
        });
        setCreatingWebhook(false);
        if (res.success) {
            setWebhookUrl("");
            setSelectedEvents([]);
            setWebhookDialogOpen(false);
            toast.success("Webhook endpoint added.");
            refresh();
        } else {
            toast.error(res.error || "Failed to add webhook.");
        }
    };

    const handleDeleteWebhook = async (webhookId: string) => {
        const res = await deleteWebhook(shopId, webhookId);
        if (res.success) {
            setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
            toast.success("Webhook removed.");
        } else {
            toast.error(res.error || "Failed to remove webhook.");
        }
    };

    const toggleEvent = (event: string) => {
        setSelectedEvents((prev) =>
            prev.includes(event)
                ? prev.filter((e) => e !== event)
                : [...prev, event],
        );
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <IconKey className="size-5 text-primary" />
                            API Access Tokens
                        </CardTitle>
                        <CardDescription>
                            Secure SHA-256 hashed keys to authenticate your
                            requests.
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                            setRawToken(null);
                            setTokenDialogOpen(true);
                        }}
                    >
                        <IconPlus className="size-4" />
                        Generate Token
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : tokens.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No tokens yet</EmptyTitle>
                                <EmptyDescription>
                                    Generate a token to connect external systems
                                    to your shop data.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Last Used</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tokens.map((token) => (
                                        <TableRow key={token.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {token.name}
                                                    </span>
                                                    <code className="text-xs text-muted-foreground">
                                                        {token.token_prefix}…
                                                    </code>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(token.last_used_at)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(token.expires_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        handleRevokeToken(
                                                            token.id,
                                                        )
                                                    }
                                                >
                                                    <IconTrash className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                        <IconAlertCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                            Tokens are only shown once when generated. We never
                            store raw keys, only their secure hashes. If you lose
                            a key, you must revoke and regenerate it.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <IconWebhook className="size-5 text-primary" />
                            Outbound Webhooks
                        </CardTitle>
                        <CardDescription>
                            Receive real-time events when orders are created or
                            updated.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setWebhookDialogOpen(true)}
                    >
                        <IconPlus className="size-4" />
                        Add Endpoint
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <Skeleton className="h-16 w-full" />
                    ) : webhooks.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No endpoints</EmptyTitle>
                                <EmptyDescription>
                                    Add an endpoint to start receiving webhook
                                    events.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        webhooks.map((webhook) => (
                            <div
                                key={webhook.id}
                                className="flex items-center justify-between rounded-xl border p-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium break-all">
                                            {webhook.url}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] uppercase"
                                        >
                                            {webhook.status_display ||
                                                webhook.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {webhook.subscribed_events.map(
                                            (event) => (
                                                <Badge
                                                    key={event}
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    {event}
                                                </Badge>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                webhook.url,
                                            );
                                            toast.success("URL copied.");
                                        }}
                                    >
                                        <IconCopy className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                            handleDeleteWebhook(webhook.id)
                                        }
                                    >
                                        <IconTrash className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Generate token dialog */}
            <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {rawToken ? "Copy your token" : "Generate API token"}
                        </DialogTitle>
                        <DialogDescription>
                            {rawToken
                                ? "This is the only time you'll see this token. Copy and store it securely."
                                : "Name your token so you can recognise it later."}
                        </DialogDescription>
                    </DialogHeader>

                    {rawToken ? (
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
                            <code className="flex-1 break-all text-sm">
                                {rawToken}
                            </code>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    navigator.clipboard.writeText(rawToken);
                                    toast.success("Token copied.");
                                }}
                            >
                                <IconCopy className="size-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="token-name">Token name</Label>
                            <Input
                                id="token-name"
                                placeholder="e.g. ERP Integration"
                                value={tokenName}
                                onChange={(e) => setTokenName(e.target.value)}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        {rawToken ? (
                            <Button
                                onClick={() => {
                                    setRawToken(null);
                                    setTokenDialogOpen(false);
                                }}
                            >
                                Done
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setTokenDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateToken}
                                    disabled={creatingToken}
                                >
                                    Generate
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add webhook dialog */}
            <Dialog
                open={webhookDialogOpen}
                onOpenChange={setWebhookDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add webhook endpoint</DialogTitle>
                        <DialogDescription>
                            We&apos;ll POST events to this URL as they happen.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="webhook-url">Endpoint URL</Label>
                            <Input
                                id="webhook-url"
                                placeholder="https://api.myerp.com/webhooks"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Events</Label>
                            <div className="flex flex-wrap gap-2">
                                {WEBHOOK_EVENTS.map((event) => {
                                    const active =
                                        selectedEvents.includes(event);
                                    return (
                                        <Button
                                            key={event}
                                            type="button"
                                            size="sm"
                                            variant={
                                                active ? "default" : "outline"
                                            }
                                            onClick={() => toggleEvent(event)}
                                        >
                                            {event}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setWebhookDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateWebhook}
                            disabled={creatingWebhook}
                        >
                            Add endpoint
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
