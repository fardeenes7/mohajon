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
                <CardTitle>WhatsApp Business</CardTitle>
                <CardDescription>
                    Connect WhatsApp Cloud API to enable real-time messaging
                    support and bot automation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!config ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            You currently do not have a WhatsApp number connected.
                            Connect with Meta OAuth to link your WhatsApp Business Account.
                        </p>
                        <ActionForm 
                            action={startWhatsAppOAuthAction} 
                            shopId={shopId} 
                            buttonText="Connect with Meta OAuth" 
                        />
                    </div>
                ) : (
                    <div className="rounded-md border p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-medium">
                                    WhatsApp Number ID: {config.phone_number_id}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    WABA ID: {config.waba_id}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    config.is_active ? "default" : "secondary"
                                }
                            >
                                {config.is_active ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
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
