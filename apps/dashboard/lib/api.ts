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

export async function getDashboardMetrics(shopId: string) {
    return authFetcher("/api/v1/shops/dashboard-metrics/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getShopTeam(shopId: string) {
    return authFetcher("/api/v1/shops/team/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function inviteShopMember(
    shopId: string,
    data: { email: string; role: string },
) {
    const res = await authFetcher("/api/v1/shops/team/invite/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/team");
    return res;
}

export async function updateShopMemberRole(
    shopId: string,
    memberId: string,
    role: string,
) {
    const res = await authFetcher(`/api/v1/shops/team/${memberId}/`, {
        method: "PATCH",
        body: { role },
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/team");
    return res;
}

export async function removeShopMember(shopId: string, memberId: string) {
    const res = await authFetcher(`/api/v1/shops/team/${memberId}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/team");
    return res;
}

export async function getShop(shopId: string) {
    return authFetcher("/api/v1/shops/me/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function updateShop(
    shopId: string,
    data: { name?: string; base_currency?: string },
) {
    const res = await authFetcher("/api/v1/shops/me/", {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/profile");
    return res;
}

export async function updateShopSettings(shopId: string, data: any) {
    const res = await authFetcher("/api/v1/shops/settings/", {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/storefront");
    return res;
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

export async function bulkUpdateProducts(
    shopId: string,
    updates: Array<{
        id: string;
        base_price?: string;
        compare_at_price?: string | null;
        tax_rate?: string;
        status?: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
    }>,
) {
    const res = await authFetcher("/api/v1/catalog/products/bulk-update/", {
        method: "POST",
        body: updates,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/products");
    return res;
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

export async function deleteWebhook(shopId: string, webhookId: string) {
    return authFetcher(`/api/v1/billing/webhooks/${webhookId}/`, {
        method: "DELETE",
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

export async function posCheckout(
    shopId: string,
    data: {
        items: Array<{ variant_id: string; quantity: number; unit_price: string }>;
        payments: Array<{ method: string; amount: string }>;
        customer_id?: string | null;
    },
) {
    const res = await authFetcher("/api/v1/orders/pos/checkout/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/orders");
    return res;
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

export async function requestPayout(
    shopId: string,
    data: { amount: string; bank_info: Record<string, string> },
) {
    const res = await authFetcher("/api/v1/accounting/payouts/request/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/accounting/balance");
    return res;
}

// ─── Purchase Order API ──────────────────────────────────────────────────────

export async function getPurchaseOrders(shopId: string) {
    return authFetcher("/api/v1/accounting/purchase-orders/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function createPurchaseOrder(shopId: string, data: any) {
    const res = await authFetcher("/api/v1/accounting/purchase-orders/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/accounting/purchase-orders");
    return res;
}

export async function updatePurchaseOrder(
    shopId: string,
    poId: string,
    data: any,
) {
    const res = await authFetcher(`/api/v1/accounting/purchase-orders/${poId}/`, {
        method: "PATCH",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/accounting/purchase-orders");
    return res;
}

export async function deletePurchaseOrder(shopId: string, poId: string) {
    const res = await authFetcher(`/api/v1/accounting/purchase-orders/${poId}/`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/accounting/purchase-orders");
    return res;
}

export async function receivePurchaseOrder(shopId: string, poId: string) {
    const res = await authFetcher(
        `/api/v1/accounting/purchase-orders/${poId}/receive/`,
        {
            method: "POST",
            headers: { "X-Tenant-ID": shopId },
        },
    );
    if (res.success) {
        revalidatePath("/accounting/purchase-orders");
        revalidatePath("/products");
    }
    return res;
}

export async function cancelPurchaseOrder(shopId: string, poId: string) {
    const res = await authFetcher(
        `/api/v1/accounting/purchase-orders/${poId}/cancel/`,
        {
            method: "POST",
            headers: { "X-Tenant-ID": shopId },
        },
    );
    if (res.success) revalidatePath("/accounting/purchase-orders");
    return res;
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

export async function reportCustomer(
    shopId: string,
    payload: { phone_number: string; reason: string; customer_name?: string; notes?: string; order_id?: string }
) {
    return authFetcher("/api/v1/fraud/report/", {
        method: "POST",
        body: payload,
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Customers API ────────────────────────────────────────────────────────────

export async function searchCustomerByPhone(shopId: string, phone: string) {
    return authFetcher("/api/v1/customers/by-phone/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: { phone },
    });
}

export async function getCustomerProfile(shopId: string, userId: string) {
    return authFetcher(`/api/v1/customers/${userId}/`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── Chat API ────────────────────────────────────────────────────────────────

export async function getInboxList(shopId: string) {
    return authFetcher("/api/v1/chat/inbox/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getInboxDetail(
    shopId: string,
    psid: string,
    channel: string = "FACEBOOK",
    before?: number,
) {
    return authFetcher(`/api/v1/chat/inbox/${encodeURIComponent(psid)}/`, {
        headers: { "X-Tenant-ID": shopId },
        queryParams: before ? { channel, before } : { channel },
    });
}

/**
 * Returns the current session's JWT access token so a Client Component can open
 * an authenticated WebSocket (the httpOnly session cookie is not readable in the
 * browser). Called on initial connect and on every reconnect to pick up a token
 * refreshed by NextAuth. Returns null when unauthenticated.
 */
export async function getChatWsToken(): Promise<string | null> {
    const session = await auth();
    return session?.accessToken ?? null;
}

export async function humanTakeover(
    shopId: string,
    pageId: string,
    psid: string,
    action: "takeover" | "handback",
    channel: string = "FACEBOOK",
) {
    return authFetcher("/api/v1/chat/takeover/", {
        method: "POST",
        body: { page_id: pageId, psid, action, channel },
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function agentSend(
    shopId: string,
    pageId: string,
    psid: string,
    text: string,
    channel: string = "FACEBOOK",
) {
    return authFetcher("/api/v1/chat/send/", {
        method: "POST",
        body: { page_id: pageId, psid, text, channel },
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

export async function getAiUsageLog(shopId: string, params?: any) {
    return authFetcher("/api/v1/billing/ai-usage/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: params,
    });
}

export async function getAiCreditLogs(shopId: string, params?: any) {
    return authFetcher("/api/v1/billing/ai-credit-lots/", {
        headers: { "X-Tenant-ID": shopId },
        queryParams: params,
    });
}

// ─── Compliance / Activity Logs ──────────────────────────────────────────────

type LogKind = "orders" | "messages" | "inventory" | "audit";

export async function getComplianceLogs(shopId: string, kind: LogKind, page = 1) {
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    return authFetcher(`/api/v1/compliance/logs/${kind}/?${params}`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

// ─── AI Credit Top-ups ───────────────────────────────────────────────────────

export async function getCreditPackages(shopId: string) {
    return authFetcher("/api/v1/billing/credit-packages/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function initiateTopUp(
    shopId: string,
    packageId: string,
    callbackUrl: string,
) {
    return authFetcher("/api/v1/billing/top-ups/initiate/", {
        method: "POST",
        body: { package_id: packageId, callback_url: callbackUrl },
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function finalizeTopUp(shopId: string, paymentId: string) {
    const res = await authFetcher("/api/v1/billing/top-ups/finalize/", {
        method: "POST",
        body: { payment_id: paymentId },
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) revalidatePath("/settings/ai-usage");
    return res;
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

// ─── Shipping API ────────────────────────────────────────────────────────────

export async function getCourierAccounts(shopId: string) {
    return authFetcher("/api/v1/shipping/accounts/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function configureCourierAccount(
    shopId: string,
    data: {
        provider: string;
        credentials: Record<string, string>;
        is_test_mode?: boolean;
        label?: string;
        default_store_id?: string;
    },
) {
    const res = await authFetcher("/api/v1/shipping/accounts/configure/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) {
        revalidatePath("/settings/shipping");
    }
    return res;
}

export async function getCourierLocations(
    shopId: string,
    params: { provider: string; city_id?: number; zone_id?: number },
) {
    const query = new URLSearchParams();
    query.append("provider", params.provider);
    if (params.city_id !== undefined) query.append("city_id", String(params.city_id));
    if (params.zone_id !== undefined) query.append("zone_id", String(params.zone_id));

    return authFetcher(`/api/v1/shipping/locations/?${query.toString()}`, {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function estimateShippingPrice(
    shopId: string,
    data: { provider: string; price_request: Record<string, any> },
) {
    return authFetcher("/api/v1/shipping/estimate-price/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function getConsignments(shopId: string) {
    return authFetcher("/api/v1/shipping/consignments/", {
        headers: { "X-Tenant-ID": shopId },
    });
}

export async function createShipment(
    shopId: string,
    data: { order_id: string; provider: string },
) {
    const res = await authFetcher("/api/v1/shipping/consignments/create/", {
        method: "POST",
        body: data,
        headers: { "X-Tenant-ID": shopId },
    });
    if (res.success) {
        revalidatePath("/shipping");
        revalidatePath("/orders");
        revalidatePath(`/orders/${data.order_id}`);
    }
    return res;
}

export async function getShipmentTracking(shopId: string, consignmentId: string) {
    return authFetcher(`/api/v1/shipping/consignments/${consignmentId}/tracking/`, {
        headers: { "X-Tenant-ID": shopId },
    });
}


