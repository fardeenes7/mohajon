import Link from "next/link";
import {
    IconPlugConnected,
    IconBrandFacebook,
    IconMessageQuestion,
    IconBuildingStore,
    IconGlobe,
    IconStar,
    IconCreditCard,
    IconShieldLock,
    IconSparkles,
    IconChevronRight,
    IconUsers,
    IconUserCircle,
    IconTruck,
} from "@tabler/icons-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import { requireActiveShopContext } from "@/lib/shop-context";

type SettingsLink = {
    title: string;
    description: string;
    href: string;
    icon: typeof IconPlugConnected;
    /** Optional plan-limit gate; hidden when the limit is falsy. */
    requires?: "developer_api" | "marketing_pixels";
};

const SETTINGS_LINKS: SettingsLink[] = [
    {
        title: "Shop Profile",
        description: "Update your store name, address, and default currency.",
        href: "/settings/profile",
        icon: IconUserCircle,
    },
    {
        title: "Team & Roles",
        description: "Invite staff, assign roles, and manage access.",
        href: "/settings/team",
        icon: IconUsers,
    },
    {
        title: "Social Connections",
        description: "Link Facebook, Instagram, and WhatsApp to your store.",
        href: "/settings/social",
        icon: IconPlugConnected,
    },
    {
        title: "Tracking & Pixels",
        description: "Configure Meta Pixel, GA4, and GTM for conversion tracking.",
        href: "/settings/tracking",
        icon: IconBrandFacebook,
        requires: "marketing_pixels",
    },
    {
        title: "FAQ & Policies",
        description: "Manage your storefront FAQ, refund, and shipping policies.",
        href: "/settings/faq",
        icon: IconMessageQuestion,
    },
    {
        title: "Storefront",
        description: "Control checkout, stock display, reviews, and maintenance mode.",
        href: "/settings/storefront",
        icon: IconBuildingStore,
    },
    {
        title: "Custom Domain",
        description: "View your store address and connect a custom domain.",
        href: "/settings/domain",
        icon: IconGlobe,
    },
    {
        title: "Shipping & Couriers",
        description: "Configure courier accounts, API credentials, and default stores.",
        href: "/settings/shipping",
        icon: IconTruck,
    },
    {
        title: "Billing & Plans",
        description: "Review your subscription, usage, and payment history.",
        href: "/settings/billing",
        icon: IconStar,
    },
    {
        title: "Payments",
        description: "Set up payout methods and configure how you get paid.",
        href: "/settings/payments",
        icon: IconCreditCard,
    },
    {
        title: "Developer API",
        description: "Generate API tokens and manage outgoing webhooks.",
        href: "/settings/api",
        icon: IconPlugConnected,
        requires: "developer_api",
    },
    {
        title: "AI Usage",
        description: "Track AI credit consumption across your store.",
        href: "/settings/ai-usage",
        icon: IconSparkles,
    },
    {
        title: "Fraud Protection",
        description: "Tune risk rules and review flagged customers.",
        href: "/settings/fraud",
        icon: IconShieldLock,
    },
];

export default async function SettingsHubPage() {
    const context = await requireActiveShopContext();
    const { limits } = context.subscription;

    const links = SETTINGS_LINKS.filter(
        (link) => !link.requires || Boolean(limits[link.requires]),
    );

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your store configuration, integrations, and billing.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map((link) => (
                    <Link key={link.href} href={link.href} className="group">
                        <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                                        <link.icon className="size-5" />
                                    </div>
                                    <IconChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <CardTitle className="mt-3 text-base">
                                    {link.title}
                                </CardTitle>
                                <CardDescription>
                                    {link.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
