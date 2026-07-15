import NextAuth, {
    type NextAuthResult,
    type DefaultSession,
    type User
} from "next-auth";
import { type JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";

declare module "next-auth" {
    interface Session extends DefaultSession {
        accessToken?: string;
        error?: string;
    }

    interface User {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        error?: string;
    }
}

async function refreshAccessToken(token: JWT) {
    try {
        const baseUrl = process.env.API_BASE_URL || "http://localhost:8000";
        console.log("Refreshing Django access token...");

        const response = await fetch(`${baseUrl}/api/v1/auth/token/refresh/`, {
            method: "POST",
            body: JSON.stringify({
                refresh: token.refreshToken
            }),
            headers: { "Content-Type": "application/json" }
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        console.log("Django Token Refresh Success");

        return {
            ...token,
            accessToken: refreshedTokens.access,
            // Default to 1 day if not provided by backend. 
            // SimpleJWT default is 1 day as per our settings.
            accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
            // Fallback to old refresh token if new one isn't returned
            refreshToken: refreshedTokens.refresh ?? token.refreshToken
        };
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError"
        };
    }
}

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

const result = NextAuth({
    cookies: {
        sessionToken: {
            name: `${cookiePrefix}dashboard.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
            },
        },
        callbackUrl: {
            name: `${cookiePrefix}dashboard.callback-url`,
            options: {
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
            },
        },
        csrfToken: {
            name: `${cookiePrefix}dashboard.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
            },
        },
        pkceCodeVerifier: {
            name: `${cookiePrefix}dashboard.pkce.code_verifier`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
                maxAge: 900,
            },
        },
        state: {
            name: `${cookiePrefix}dashboard.state`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
                maxAge: 900,
            },
        },
        nonce: {
            name: `${cookiePrefix}dashboard.nonce`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
            },
        },
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    callbacks: {
        async signIn({ account }) {
            if (account?.provider === "google") {
                return !!account.access_token;
            }
            return false;
        },
        async jwt({ token, account }) {
            // 1. Initial sign-in: Exchange Google token for Django JWT
            if (account?.provider === "google" && account.access_token) {
                try {
                    const baseUrl = process.env.API_BASE_URL || "http://localhost:8000";

                    const response = await fetch(
                        `${baseUrl}/api/v1/auth/google/`,
                        {
                            method: "POST",
                            body: JSON.stringify({ access_token: account.access_token }),
                            headers: { "Content-Type": "application/json" }
                        }
                    );

                    const responseText = await response.text();

                    if (response.ok) {
                        const data = JSON.parse(responseText);

                        return {
                            ...token,
                            sub: String(data.user.pk),
                            accessToken: data.access,
                            refreshToken: data.refresh,
                            // Set expiry (default 1 day)
                            accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000
                        };
                    } else {
                        console.error("Django Auth Failed:", response.status, responseText);
                        token.error = "DjangoAuthError";
                    }
                } catch (error) {
                    console.error("Error during jwt callback:", error);
                    token.error = "DjangoAuthError";
                }
            }

            // 2. Subsequent use: Return previous token if the access token has not expired yet
            // We use a 30 second buffer
            if (
                token.accessTokenExpires &&
                Date.now() < token.accessTokenExpires - 30 * 1000
            ) {
                return token;
            }

            // 3. Access token has expired, try to update it
            if (token.refreshToken) {
                return refreshAccessToken(token);
            }

            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.error = token.error;
            return session;
        }
    },
    pages: {
        signIn: "/login",
        error: "/login"
    },
    session: {
        strategy: "jwt"
    }
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
