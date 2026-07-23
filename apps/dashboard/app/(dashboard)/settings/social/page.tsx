import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@repo/ui/components/ui/alert";
import { IconInfoCircle, IconAlertCircle } from "@tabler/icons-react";
import { getSocialConnections, getWhatsAppConfig } from "@/lib/api";
import { handleSocialOAuthCallback, handleWhatsAppOAuthCallback } from "@/lib/api";
import { requireActiveShopContext } from "@/lib/shop-context";
import { SocialConnectionsPanel } from "./SocialConnectionsPanel";
import { WhatsAppConnectionPanel } from "./WhatsAppConnectionPanel";
import { Button } from "@repo/ui/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@repo/ui/components/ui/card";
import {
    startSocialOAuthAction,
    completeWhatsAppOAuthSelectionAction,
} from "./actions";
import { ActionForm } from "./ActionForm";

export const metadata: Metadata = {
    title: "Social Connections | Mohajon Dashboard"
};

export default async function SocialConnectionsPage({
    searchParams
}: {
    searchParams: Promise<{ code?: string; state?: string; error?: string; error_description?: string; error_reason?: string }>;
}) {
    const activeShop = await requireActiveShopContext();
    const params = await searchParams;

    let oauthStateForSelection: string | null = null;
    let oauthPages: Array<{ id: string; name: string; display_phone_number?: string }> = [];
    let isWhatsAppAuth = false;
    let socialError: string | null = null;

    if (params.error || params.error_description || params.error_reason) {
        socialError = params.error_description || params.error_reason || params.error || "Meta connection was cancelled or denied.";
    } else if (params.code && params.state) {
        isWhatsAppAuth = params.state.startsWith("wa_");
        
        if (isWhatsAppAuth) {
            const oauthRes = await handleWhatsAppOAuthCallback(activeShop.shopId, {
                code: params.code,
                state: params.state
            });
            if (oauthRes.success) {
                oauthStateForSelection = oauthRes.data.oauth_state ?? null;
                oauthPages = oauthRes.data.pages ?? [];
            } else {
                socialError = oauthRes.error || "Failed to complete WhatsApp connection.";
            }
        } else {
            const cleanState = params.state.split("#")[0];
            const oauthRes = await handleSocialOAuthCallback(activeShop.shopId, {
                code: params.code,
                state: cleanState
            });
            if (oauthRes.success) {
                redirect("/settings/social");
            } else {
                socialError = oauthRes.error || "Failed to connect Meta account. Please try again.";
            }
        }
    }

    const connectionsRes = await getSocialConnections(activeShop.shopId);
    const whatsappRes = await getWhatsAppConfig(activeShop.shopId);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Social Connections</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Connect Meta pages and manage social publishing health.
                </p>
            </div>

            {socialError ? (
                <Alert variant="destructive">
                    <IconAlertCircle className="size-4" />
                    <AlertTitle>Meta Connection Failed</AlertTitle>
                    <AlertDescription>{socialError}</AlertDescription>
                </Alert>
            ) : null}

            <Alert>
                <IconInfoCircle className="size-4" />
                <AlertTitle>Token lifecycle is monitored</AlertTitle>
                <AlertDescription>
                    Expired page tokens are marked and social publishing is
                    paused until reconnect.
                </AlertDescription>
            </Alert>

            <WhatsAppConnectionPanel
                shopId={activeShop.shopId}
                config={whatsappRes.success ? whatsappRes.data : null}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Facebook Connect</CardTitle>
                    <CardDescription>
                        Connect Meta via OAuth to automatically connect all managed Facebook pages.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <ActionForm 
                        action={startSocialOAuthAction} 
                        shopId={activeShop.shopId} 
                        buttonText="Connect with Meta OAuth" 
                    />
                    
                    {oauthStateForSelection && oauthPages.length > 0 && isWhatsAppAuth ? (
                        <ActionForm
                            action={completeWhatsAppOAuthSelectionAction}
                            shopId={activeShop.shopId}
                            buttonText="Save WhatsApp Number"
                        >
                            <input
                                type="hidden"
                                name="oauthState"
                                value={oauthStateForSelection}
                            />
                            <select
                                name="selectedPhoneId"
                                required
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Select WhatsApp Number
                                </option>
                                {oauthPages.map((page) => (
                                    <option key={page.id} value={page.id}>
                                        {page.display_phone_number} ({page.name})
                                    </option>
                                ))}
                            </select>
                        </ActionForm>
                    ) : null}
                </CardContent>
            </Card>

            <SocialConnectionsPanel
                shopId={activeShop.shopId}
                initialConnections={
                    connectionsRes.success ? connectionsRes.data : []
                }
            />
        </div>
    );
}

