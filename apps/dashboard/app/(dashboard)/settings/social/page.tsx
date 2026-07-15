import type { Metadata } from "next";
import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@repo/ui/components/ui/alert";
import { IconInfoCircle } from "@tabler/icons-react";
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
    completeSocialOAuthSelectionAction,
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
    searchParams: Promise<{ code?: string; state?: string }>;
}) {
    const activeShop = await requireActiveShopContext();
    const params = await searchParams;

    let oauthStateForSelection: string | null = null;
    let oauthPages: Array<{ id: string; name: string; display_phone_number?: string }> = [];
    let isWhatsAppAuth = false;

    if (params.code && params.state) {
        isWhatsAppAuth = params.state.startsWith("wa_");
        
        if (isWhatsAppAuth) {
            const oauthRes = await handleWhatsAppOAuthCallback(activeShop.shopId, {
                code: params.code,
                state: params.state
            });
            if (oauthRes.success) {
                oauthStateForSelection = oauthRes.data.oauth_state ?? null;
                oauthPages = oauthRes.data.pages ?? [];
            }
        } else {
            const oauthRes = await handleSocialOAuthCallback(activeShop.shopId, {
                code: params.code,
                state: params.state
            });
            if (oauthRes.success) {
                oauthStateForSelection = oauthRes.data.oauth_state ?? null;
                oauthPages = oauthRes.data.pages ?? [];
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
                        Connect Meta via OAuth and choose a managed page for Product Publishing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <ActionForm 
                        action={startSocialOAuthAction} 
                        shopId={activeShop.shopId} 
                        buttonText="Connect with Meta OAuth" 
                    />

                    {oauthStateForSelection && oauthPages.length > 0 && !isWhatsAppAuth ? (
                        <form
                            action={completeSocialOAuthSelectionAction}
                            className="flex items-center gap-3"
                        >
                            <input
                                type="hidden"
                                name="shopId"
                                value={activeShop.shopId}
                            />
                            <input
                                type="hidden"
                                name="oauthState"
                                value={oauthStateForSelection}
                            />
                            <select
                                name="selectedPageId"
                                required
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Select page to connect
                                </option>
                                {oauthPages.map((page) => (
                                    <option key={page.id} value={page.id}>
                                        {page.name}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit" variant="outline">
                                Save Selected Page
                            </Button>
                        </form>
                    ) : null}
                    
                    {oauthStateForSelection && oauthPages.length > 0 && isWhatsAppAuth ? (
                        <form
                            action={completeWhatsAppOAuthSelectionAction}
                            className="flex items-center gap-3"
                        >
                            <input
                                type="hidden"
                                name="shopId"
                                value={activeShop.shopId}
                            />
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
                            <Button type="submit" variant="outline">
                                Save WhatsApp Number
                            </Button>
                        </form>
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

