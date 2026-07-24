import { ActiveLink } from "./ActiveLink";

export default async function AiUsageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">AI Usage & Credits</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your AI credits balance and view usage history.
                </p>
            </div>

            <div className="border-b border-border">
                <div className="flex items-center gap-6">
                    <ActiveLink href="/settings/ai-usage" exact>
                        Overview
                    </ActiveLink>
                    <ActiveLink href="/settings/ai-usage/usage">
                        Usage History
                    </ActiveLink>
                </div>
            </div>

            {children}
        </div>
    );
}
