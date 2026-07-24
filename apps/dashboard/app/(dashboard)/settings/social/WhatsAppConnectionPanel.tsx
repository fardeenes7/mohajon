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
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { startWhatsAppOAuthAction, disconnectWhatsAppAction } from "./actions";
import { ActionForm } from "./ActionForm";

interface WhatsAppConfig {
    id: string;
    phone_number_id: string;
    waba_id: string;
    is_active: boolean;
}

interface WhatsAppConnectionPanelProps {
    shopId: string;
    config: WhatsAppConfig | null;
}

export function WhatsAppConnectionPanel({
    shopId,
    config,
}: WhatsAppConnectionPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconBrandWhatsapp className="size-5" />
                    WhatsApp Business
                </CardTitle>
                <CardDescription>
                    Connect WhatsApp Cloud API to enable real-time messaging
                    support and bot automation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!config ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center bg-muted/10">
                        <div className="rounded-full bg-muted p-3">
                            <IconBrandWhatsapp className="size-6 text-muted-foreground" />
                        </div>
                        <div className="max-w-sm space-y-1">
                            <p className="text-sm font-medium">No WhatsApp connected</p>
                            <p className="text-sm text-muted-foreground">
                                Connect with Meta OAuth to link your WhatsApp Business Account.
                            </p>
                        </div>
                        <div className="pt-2">
                            <ActionForm 
                                action={startWhatsAppOAuthAction} 
                                shopId={shopId} 
                                buttonText="Connect with Meta OAuth" 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-muted/40 p-5 space-y-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-medium leading-none">
                                    Number ID: {config.phone_number_id}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    WABA ID: {config.waba_id}
                                </p>
                            </div>
                            <Badge
                                variant={config.is_active ? "outline" : "secondary"}
                                className={config.is_active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}
                            >
                                {config.is_active ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                        </div>
                        <Separator className="bg-border/60" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Ready to receive and send messages.</span>
                            <form action={disconnectWhatsAppAction}>
                                <input
                                    type="hidden"
                                    name="shopId"
                                    value={shopId}
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
                )}
            </CardContent>
        </Card>
    );
}
