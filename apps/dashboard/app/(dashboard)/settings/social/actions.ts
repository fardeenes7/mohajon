"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    createSocialConnection,
    disconnectSocialConnection,
    startSocialOAuth,
    handleSocialOAuthCallback,
} from "@/lib/api";

export async function createSocialConnectionAction(formData: FormData) {
    const shopId = String(formData.get("shopId") || "");
    const pageId = String(formData.get("pageId") || "");
    const pageName = String(formData.get("pageName") || "");
    const accessToken = String(formData.get("accessToken") || "");
    const expiresInRaw = formData.get("expiresIn");

    if (!shopId || !pageId || !pageName || !accessToken) {
        return;
    }

    const expiresIn = expiresInRaw ? Number(expiresInRaw) : undefined;

    const res = await createSocialConnection(shopId, {
        provider: "META",
        page_id: pageId,
        page_name: pageName,
        access_token: accessToken,
        ...(Number.isFinite(expiresIn) ? { expires_in: expiresIn } : {}),
    });

    if (!res.success) {
        return;
    }

    revalidatePath("/settings/social");
    revalidatePath("/products");
}

export async function disconnectSocialConnectionAction(formData: FormData) {
    const shopId = String(formData.get("shopId") || "");
    const connectionId = String(formData.get("connectionId") || "");

    if (!shopId || !connectionId) {
        return;
    }

    const res = await disconnectSocialConnection(shopId, connectionId);
    if (!res.success) {
        return;
    }

    revalidatePath("/settings/social");
    revalidatePath("/products");
}

export async function startSocialOAuthAction(formData: FormData) {
    const shopId = String(formData.get("shopId") || "");
    if (!shopId) return { error: "Missing shop ID" };

    const { startSocialOAuth } = await import("@/lib/api");
    const res = await startSocialOAuth(shopId);
    if (!res.success) {
        return { error: res.error || "Failed to start OAuth" };
    }
    if (!res.data?.auth_url) {
        return { error: "No auth_url returned" };
    }

    redirect(res.data.auth_url);
}

export async function completeSocialOAuthSelectionAction(formData: FormData) {
    const shopId = String(formData.get("shopId") || "");
    const oauthState = String(formData.get("oauthState") || "");
    const selectedPageId = String(formData.get("selectedPageId") || "");

    if (!shopId || !oauthState || !selectedPageId) return { error: "Missing required fields" };

    const { handleSocialOAuthCallback } = await import("@/lib/api");
    const res = await handleSocialOAuthCallback(shopId, {
        oauth_state: oauthState,
        selected_page_id: selectedPageId,
    });
    if (!res.success) return { error: res.error || "Failed to complete connection" };

    revalidatePath("/settings/social");
    revalidatePath("/products");
}

export async function disconnectWhatsAppAction(formData: FormData) {
    const shopId = String(formData.get("shopId") || "");
    if (!shopId) return;

    const { disconnectWhatsAppConfig } = await import("@/lib/api");
    const res = await disconnectWhatsAppConfig(shopId);
    if (!res.success) return;

    revalidatePath("/settings/social");
}

export async function startWhatsAppOAuthAction(formData: FormData) {
    const shopId = String(formData.get("shopId") || "");
    if (!shopId) return { error: "Missing shop ID" };

    const { startWhatsAppOAuth } = await import("@/lib/api");
    const res = await startWhatsAppOAuth(shopId);
    if (!res.success) {
        return { error: res.error || "Failed to start WhatsApp OAuth" };
    }
    if (!res.data?.auth_url) {
        return { error: "No auth_url returned" };
    }

    redirect(res.data.auth_url);
}

export async function completeWhatsAppOAuthSelectionAction(formData: FormData) {
    const shopId = String(formData.get("shopId") || "");
    const oauthState = String(formData.get("oauthState") || "");
    const selectedPhoneId = String(formData.get("selectedPhoneId") || "");
    
    if (!shopId || !oauthState || !selectedPhoneId) return { error: "Missing required fields" };

    const { saveWhatsAppOAuthSelection } = await import("@/lib/api");
    const res = await saveWhatsAppOAuthSelection(shopId, {
        oauth_state: oauthState,
        selected_phone_id: selectedPhoneId,
    });
    
    if (!res.success) return { error: res.error || "Failed to save WhatsApp number" };

    revalidatePath("/settings/social");
}
