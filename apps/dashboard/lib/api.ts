/**
 * Dashboard API helpers & Server Actions.
 *
 * All functions are 'use server' and can be called from both
 * Server Components and Client Components (as Server Actions).
 */
"use server";

import { revalidatePath } from "next/cache";
import { fetcher, type ApiResponse } from "@repo/api";
import { auth } from "@/auth";

/**
 * The app-specific authFetcher wrapper.
 * Retrieves the JWT from cookies and merges it into the headers.
 */
export async function authFetcher<T = any>(
    url: string,
    options: {
        method?: string;
        body?: any;
        headers?: Record<string, string>;
        queryParams?: any;
    } = {},
): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, queryParams } = options;

    const session = await auth();
    const token = session?.accessToken;

    const mergedHeaders = { ...headers };
    if (token) {
        mergedHeaders["Authorization"] = `Bearer ${token}`;
    }

    return fetcher<T>(url, method, body, mergedHeaders, queryParams);
}

// ─── Shop & Context API ──────────────────────────────────────────────────────

export async function getActiveShopContext() {
    return authFetcher("/api/v1/shops/active/");
}

// ─── Category API ────────────────────────────────────────────────────────────

export async function getCategories(shopId: string) {
    return authFetcher("/api/v1/catalog/categories/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function createCategory(shopId: string, data: any) {
    const res = await authFetcher("/api/v1/catalog/categories/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/categories");
    return res;
}

export async function updateCategory(
    shopId: string,
    categoryId: string,
    data: any,
) {
    const res = await authFetcher(`/api/v1/catalog/categories/${categoryId}/`, {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/categories");
    return res;
}

// ─── Media API ───────────────────────────────────────────────────────────────

export async function getMedia(
    shopId: string,
    params?: { page?: number; page_size?: number; search?: string },
) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.page_size)
        query.append("page_size", params.page_size.toString());
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return authFetcher(`/api/v1/media/${queryString}`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function deleteCategory(shopId: string, categoryId: string) {
    const res = await authFetcher(`/api/v1/catalog/categories/${categoryId}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/categories");
    return res;
}

// ─── Product API ─────────────────────────────────────────────────────────────

export async function getProducts(shopId: string, params?: any) {
    return authFetcher("/api/v1/catalog/products/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: params,
    });
}

export async function getProduct(shopId: string, productId: string) {
    return authFetcher(`/api/v1/catalog/products/${productId}/`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function createProduct(shopId: string, data: any) {
    const res = await authFetcher("/api/v1/catalog/products/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/products");
    return res;
}

export async function updateProduct(
    shopId: string,
    productId: string,
    data: any,
) {
    const res = await authFetcher(`/api/v1/catalog/products/${productId}/`, {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) {
        revalidatePath("/products");
        revalidatePath(`/products/${productId}`);
    }
    return res;
}

export async function deleteProduct(shopId: string, productId: string) {
    const res = await authFetcher(`/api/v1/catalog/products/${productId}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/products");
    return res;
}

export async function createVariant(
    shopId: string,
    productId: string,
    data: any,
) {
    const res = await authFetcher(
        `/api/v1/catalog/products/${productId}/variants/`,
        {
            method: "POST",
            body: data,
            headers: { "X-Tenant-ID": shopId },
        },
    );
    if (res.success) revalidatePath(`/products/${productId}`);
    return res;
}

export async function updateVariant(
    shopId: string,
    productId: string,
    variantId: string,
    data: any,
) {
    const res = await authFetcher(
        `/api/v1/catalog/products/${productId}/variants/${variantId}/`,
        {
            method: "PATCH",
            body: data,
            headers: { "X-Tenant-ID": shopId },
        },
    );
    if (res.success) revalidatePath(`/products/${productId}`);
    return res;
}

export async function publishProduct(shopId: string, productId: string) {
    const res = await authFetcher(
        `/api/v1/catalog/products/${productId}/publish/`,
        {
            method: "POST",
            headers: { "X-Tenant-ID": shopId },
        },
    );
    if (res.success) revalidatePath("/products");
    return res;
}

export async function archiveProduct(shopId: string, productId: string) {
    const res = await authFetcher(
        `/api/v1/catalog/products/${productId}/archive/`,
        {
            method: "POST",
            headers: { "X-Tenant-ID": shopId },
        },
    );
    if (res.success) revalidatePath("/products");
    return res;
}

export async function generateProductAiDescription(shopId: string, data: any) {
    return authFetcher("/api/v1/catalog/products/ai-generate-description/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function generateProductAiImage(shopId: string, data: any) {
    return authFetcher("/api/v1/catalog/products/ai-generate-image/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Media API ───────────────────────────────────────────────────────────────

export async function getPresignedUploadUrl(
    filename: string,
    contentType: string,
    shopId: string,
) {
    return authFetcher("/api/v1/media/upload-url/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: { filename, content_type: contentType },
    });
}

export async function confirmUpload(
    s3Key: string,
    originalFilename: string,
    shopId: string,
) {
    const res = await authFetcher("/api/v1/media/confirm/", {
        method: "POST",
        body: { s3_key: s3Key, original_filename: originalFilename },
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/media");
    return res;
}

export async function deleteMedia(shopId: string, mediaId: string) {
    const res = await authFetcher(`/api/v1/media/${mediaId}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/media");
    return res;
}

// ─── Social API ──────────────────────────────────────────────────────────────

export async function getSocialConnections(shopId: string) {
    return authFetcher("/api/v1/marketing/social/connections/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getProductSocialActivity(
    shopId: string,
    productId: string,
) {
    return authFetcher(
        `/api/v1/marketing/social/products/${productId}/activity/`,
        {
            headers: { "X-Tenant-ID": shopId },
        },
    );
}

export async function createSocialConnection(shopId: string, data: any) {
    return authFetcher("/api/v1/marketing/social/connections/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function disconnectSocialConnection(
    shopId: string,
    connectionId: string,
) {
    return authFetcher(
        `/api/v1/marketing/social/connections/${connectionId}/`,
        {
            method: "DELETE",
            headers: { "X-Tenant-ID": shopId },
        },
    );
}

export async function startSocialOAuth(shopId: string) {
    return authFetcher("/api/v1/marketing/social/connect/start/", {
        method: "POST",
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function handleSocialOAuthCallback(shopId: string, data: any) {
    return authFetcher("/api/v1/marketing/social/connect/callback/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function publishProductToSocial(shopId: string, data: any) {
    return authFetcher("/api/v1/marketing/social/publish/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Shop & Settings API ─────────────────────────────────────────────────────

export async function updateTrackingConfig(shopId: string, data: any) {
    const res = await authFetcher(`/api/v1/shops/tracking/`, {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/tracking");
    return res;
}

export async function getTrackingConfig(shopId: string) {
    return authFetcher(`/api/v1/shops/tracking/`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getStoreTheme() {
    return authFetcher(`/api/v1/shops/theme/`);
}

export async function updateStoreTheme(data: any) {
    const res = await authFetcher(`/api/v1/shops/theme/`, {
        method: "PATCH",
        body: data,
    });
    if (res.success) revalidatePath("/builder");
    return res;
}

// ─── Shop Actions ────────────────────────────────────────────────────────────

export async function createShopAction(data: any) {
    const res = await authFetcher("/api/v1/shops/create/", {
        method: "POST",
        body: data,
    });

    if (res.success) {
        revalidatePath("/");
    }

    return res;
}

// ─── Payment API ─────────────────────────────────────────────────────────────

export async function getPaymentMethods(shopId: string) {
    return authFetcher("/api/v1/billing/methods/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getPaymentGateways(shopId: string) {
    return authFetcher("/api/v1/billing/gateways/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function configurePaymentGateway(
    shopId: string,
    data: {
        gateway: string;
        credentials: Record<string, string>;
        is_test_mode?: boolean;
        label?: string;
    },
) {
    const res = await authFetcher("/api/v1/billing/gateways/configure/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/payments");
    return res;
}

export async function updatePaymentMethod(
    shopId: string,
    methodId: string,
    data: any,
) {
    const res = await authFetcher(`/api/v1/billing/methods/${methodId}/`, {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/payments");
    return res;
}

// ─── Developer API ───────────────────────────────────────────────────────────

export async function getApiTokens(shopId: string) {
    return authFetcher("/api/v1/billing/tokens/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function createApiToken(
    shopId: string,
    data: { name: string; scopes: string[] },
) {
    return authFetcher("/api/v1/billing/tokens/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function revokeApiToken(shopId: string, tokenId: string) {
    return authFetcher(`/api/v1/billing/tokens/${tokenId}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getWebhooks(shopId: string) {
    return authFetcher("/api/v1/billing/webhooks/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function registerWebhook(
    shopId: string,
    data: { url: string; subscribed_events: string[] },
) {
    return authFetcher("/api/v1/billing/webhooks/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function claimShopAction(_prevState: any, formData: FormData) {
    const token = formData.get("token") as string;
    const subdomain = formData.get("subdomain") as string;
    const password = formData.get("password") as string;

    if (!token || !subdomain || !password) {
        return { success: false, error: "All fields are required." };
    }

    const res = await fetcher("/api/v1/shops/claim/", "POST", {
        token,
        subdomain,
        password,
    });
    return res;
}

// ─── Analytics API ───────────────────────────────────────────────────────────

export async function getSalesAnalytics(
    shopId: string,
    params?: { start_date?: string; end_date?: string },
) {
    return authFetcher("/api/v1/analytics/metrics/sales/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: params,
    });
}

export async function getTopCustomers(shopId: string, limit: number = 10) {
    return authFetcher("/api/v1/analytics/metrics/top_customers/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: { limit },
    });
}

export async function getCohortAnalytics(shopId: string) {
    return authFetcher("/api/v1/analytics/metrics/cohorts/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Affiliate API ──────────────────────────────────────────────────────────

export async function getAffiliateStats(shopId: string) {
    return authFetcher("/api/v1/affiliates/stats/", {
        headers: { "X-Tenant-ID": shopId },
    });
}
// ─── Order API ───────────────────────────────────────────────────────────────

export async function getOrders(shopId: string, params?: any) {
    return authFetcher("/api/v1/orders/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: params,
    });
}

export async function getOrder(shopId: string, orderId: string) {
    return authFetcher(`/api/v1/orders/${orderId}/`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function transitionOrder(
    shopId: string,
    orderId: string,
    data: { to_status: string; reason?: string },
) {
    const res = await authFetcher(`/api/v1/orders/${orderId}/transition/`, {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) {
        revalidatePath("/orders");
        revalidatePath(`/orders/${orderId}`);
    }
    return res;
}

// ─── Accounting API ──────────────────────────────────────────────────────────

export async function getMerchantBalance(shopId: string) {
    return authFetcher("/api/v1/accounting/balance/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getMerchantPayouts(shopId: string) {
    return authFetcher("/api/v1/accounting/payouts/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getMerchantLedger(shopId: string) {
    return authFetcher("/api/v1/accounting/ledger/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Purchase Order API ──────────────────────────────────────────────────────

export async function getPurchaseOrders(shopId: string) {
    return authFetcher("/api/v1/accounting/purchase-orders/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function createPurchaseOrder(shopId: string, data: any) {
    return authFetcher("/api/v1/accounting/purchase-orders/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function updatePurchaseOrder(
    shopId: string,
    poId: string,
    data: any,
) {
    return authFetcher(`/api/v1/accounting/purchase-orders/${poId}/`, {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function deletePurchaseOrder(shopId: string, poId: string) {
    return authFetcher(`/api/v1/accounting/purchase-orders/${poId}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Fraud API ──────────────────────────────────────────────────────────────

export async function getFraudConfig(shopId: string) {
    return authFetcher("/api/v1/fraud/config/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function updateFraudConfig(shopId: string, data: any) {
    return authFetcher("/api/v1/fraud/config/", {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function checkCustomerRisk(shopId: string, phoneNumber: string) {
    return authFetcher("/api/v1/fraud/check_risk/", {
        method: "POST",
        body: { phone_number: phoneNumber },
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Chat API ────────────────────────────────────────────────────────────────

export async function getInboxList(shopId: string) {
    return authFetcher("/api/v1/chat/inbox/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getInboxDetail(shopId: string, psid: string) {
    return authFetcher(`/api/v1/chat/inbox/${psid}/`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function humanTakeover(shopId: string, pageId: string, psid: string, action: "takeover" | "handback") {
    return authFetcher("/api/v1/chat/takeover/", {
        method: "POST",
        body: { page_id: pageId, psid, action },
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function agentSend(shopId: string, pageId: string, psid: string, text: string) {
    return authFetcher("/api/v1/chat/send/", {
        method: "POST",
        body: { page_id: pageId, psid, text },
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getFaqList(shopId: string) {
    return authFetcher("/api/v1/chat/faq/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function createFaq(shopId: string, payload: any) {
    const res = await authFetcher("/api/v1/chat/faq/", {
        method: "POST",
        body: payload,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/faq");
    return res;
}

export async function updateFaq(shopId: string, id: string, payload: any) {
    const res = await authFetcher(`/api/v1/chat/faq/${id}/`, {
        method: "PUT",
        body: payload,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/faq");
    return res;
}

export async function deleteFaq(shopId: string, id: string) {
    const res = await authFetcher(`/api/v1/chat/faq/${id}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/faq");
    return res;
}

export async function adjustStock(
    shopId: string,
    productId: string,
    variantId: string,
    delta: number,
    reason: string,
    referenceId?: string
) {
    return authFetcher(
        `/api/v1/catalog/products/${productId}/variants/${variantId}/adjust-stock/`,
        {
            method: "POST",
            headers: {
                "X-Tenant-ID": shopId,
            },
            body: { delta, reason, reference_id: referenceId || "" },
        }
    );
}

// ─── AI API ──────────────────────────────────────────────────────────────────

export async function getShopSettings(shopId: string) {
    return authFetcher("/api/v1/shops/settings/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getAiUsageLog(shopId: string) {
    return authFetcher("/api/v1/billing/ai-usage/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── WhatsApp Config API ─────────────────────────────────────────────────────

export async function getWhatsAppConfig(shopId: string) {
    return authFetcher("/api/v1/chat/whatsapp/config/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function disconnectWhatsAppConfig(shopId: string) {
    return authFetcher("/api/v1/chat/whatsapp/config/", {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function startWhatsAppOAuth(shopId: string) {
    return authFetcher("/api/v1/chat/whatsapp/oauth/start/", {
        method: "POST",
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function handleWhatsAppOAuthCallback(shopId: string, data: any) {
    return authFetcher("/api/v1/chat/whatsapp/oauth/callback/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function saveWhatsAppOAuthSelection(shopId: string, data: any) {
    return authFetcher("/api/v1/chat/whatsapp/oauth/save/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

