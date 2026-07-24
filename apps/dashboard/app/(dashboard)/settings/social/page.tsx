import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@repo/ui/components/ui/alert";
import { IconInfoCircle, IconAlertCircle } from "@tabler/icons-react";
import { getSocialConnections, getWhatsAppConfig } from "@/lib/api";
import {
    handleSocialOAuthCallback,
    handleWhatsAppOAuthCallback
} from "@/lib/api";
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
    completeWhatsAppOAuthSelectionAction
} from "./actions";
import { ActionForm } from "./ActionForm";

export const metadata: Metadata = {
    title: "Social Connections | Mohajon Dashboard"
};

export default async function SocialConnectionsPage({
    searchParams
}: {
    searchParams: Promise<{
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
        error_reason?: string;
    }>;
}) {
    const activeShop = await requireActiveShopContext();
    const params = await searchParams;

    let oauthStateForSelection: string | null = null;
    let oauthPages: Array<{
        id: string;
        name: string;
        display_phone_number?: string;
    }> = [];
    let isWhatsAppAuth = false;
    let socialError: string | null = null;

    if (params.error || params.error_description || params.error_reason) {
        socialError =
            params.error_description ||
            params.error_reason ||
            params.error ||
            "Meta connection was cancelled or denied.";
    } else if (params.code && params.state) {
        isWhatsAppAuth = params.state.startsWith("wa_");

        if (isWhatsAppAuth) {
            const oauthRes = await handleWhatsAppOAuthCallback(
                activeShop.shopId,
                {
                    code: params.code,
                    state: params.state
                }
            );
            if (oauthRes.success) {
                oauthStateForSelection = oauthRes.data.oauth_state ?? null;
                oauthPages = oauthRes.data.pages ?? [];
            } else {
                socialError =
                    oauthRes.error || "Failed to complete WhatsApp connection.";
            }
        } else {
            const cleanState = params.state.split("#")[0];
            const oauthRes = await handleSocialOAuthCallback(
                activeShop.shopId,
                {
                    code: params.code,
                    state: cleanState
                }
            );
            if (oauthRes.success) {
                redirect("/settings/social");
            } else {
                socialError =
                    oauthRes.error ||
                    "Failed to connect Meta account. Please try again.";
            }
        }
    }

    const connectionsRes = await getSocialConnections(activeShop.shopId);
    const whatsappRes = await getWhatsAppConfig(activeShop.shopId);

    return (
        <div className="container flex flex-col gap-8">
            <div>
                <div className="mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                        Platform Integrations
                    </span>
                </div>
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

            {oauthStateForSelection &&
            oauthPages.length > 0 &&
            isWhatsAppAuth ? (
                <Card className="border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10">
                    <CardHeader>
                        <CardTitle>Select WhatsApp Number</CardTitle>
                        <CardDescription>
                            Please select the WhatsApp number you wish to
                            connect from your Meta account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1 min-w-[250px]"
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Select WhatsApp Number
                                </option>
                                {oauthPages.map((page) => (
                                    <option key={page.id} value={page.id}>
                                        {page.display_phone_number} ({page.name}
                                        )
                                    </option>
                                ))}
                            </select>
                        </ActionForm>
                    </CardContent>
                </Card>
            ) : null}

            <Alert>
                <IconInfoCircle className="size-4" />
                <AlertTitle>Token lifecycle is monitored</AlertTitle>
                <AlertDescription>
                    Expired page tokens are marked and social publishing is
                    paused until reconnect.
                </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-8">
                <SocialConnectionsPanel
                    shopId={activeShop.shopId}
                    initialConnections={
                        connectionsRes.success ? connectionsRes.data : []
                    }
                />
                <WhatsAppConnectionPanel
                    shopId={activeShop.shopId}
                    config={whatsappRes.success ? whatsappRes.data : null}
                />
            </div>
        </div>
    );
}
