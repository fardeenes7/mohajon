"use client";

import {
    IconBox,
    IconCategory,
    IconDashboard,
    IconSettings,
    IconBrandFacebook,
    IconPlugConnected,
    IconMessage,
    IconMessageQuestion,
    IconBuildingStore,
    IconGlobe,
    IconStar,
    IconCreditCard,
    IconChartBar,
    IconAffiliate,
    IconShieldLock,
    IconShoppingCart,
    IconTags,
    IconDeviceIpadHorizontal,
    IconPhoto,
    IconSpeakerphone,
    IconUsers,
    IconUserCircle,
    IconAddressBook,
    IconHistory
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@repo/ui/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/avatar";
import { DashboardShopContext } from "@/lib/shop-context";

const sidebarGroups = [
    {
        label: "Main",
        items: [
            { title: "Overview", href: "/", icon: IconDashboard },
            { title: "Orders", href: "/orders", icon: IconShoppingCart },
            { title: "Inbox", href: "/inbox", icon: IconMessage },
            { title: "Customers", href: "/customers", icon: IconAddressBook }
        ]
    },
    {
        label: "Catalog",
        items: [
            { title: "Products", href: "/products", icon: IconTags },
            { title: "Categories", href: "/categories", icon: IconCategory },
            { title: "Media Library", href: "/media", icon: IconPhoto }
        ]
    },
    {
        label: "Sales Channels",
        items: [
            { title: "Store Builder", href: "/builder", icon: IconBuildingStore },
            { title: "POS System", href: "/pos", icon: IconDeviceIpadHorizontal }
        ]
    },
    {
        label: "Analytics & Growth",
        items: [
            { title: "Advanced Analytics", href: "/analytics", icon: IconChartBar },
            { title: "Affiliate Program", href: "/affiliates", icon: IconAffiliate },
            { title: "Marketing / Ads", href: "/marketing/ads", icon: IconSpeakerphone }
        ]
    },
    {
        label: "Accounting",
        items: [
            { title: "Platform Balance", href: "/accounting/balance", icon: IconCreditCard },
            { title: "Purchase Orders", href: "/accounting/purchase-orders", icon: IconBox }
        ]
    },
    {
        label: "Configuration",
        items: [
            { title: "Shop Profile", href: "/settings/profile", icon: IconUserCircle },
            { title: "Team & Roles", href: "/settings/team", icon: IconUsers },
            { title: "Social Connections", href: "/settings/social", icon: IconPlugConnected },
            { title: "Tracking & Pixels", href: "/settings/tracking", icon: IconBrandFacebook },
            { title: "FAQ & Policies", href: "/settings/faq", icon: IconMessageQuestion },
            { title: "Storefront", href: "/settings/storefront", icon: IconBuildingStore },
            { title: "Custom Domain", href: "/settings/domain", icon: IconGlobe },
            { title: "Billing & Plans", href: "/settings/billing", icon: IconStar },
            { title: "Payments", href: "/settings/payments", icon: IconCreditCard },
            { title: "Developer API", href: "/settings/api", icon: IconPlugConnected },
            { title: "Fraud Protection", href: "/settings/fraud", icon: IconShieldLock },
            { title: "Activity Logs", href: "/compliance/logs", icon: IconHistory },
            { title: "Settings", href: "/settings", icon: IconSettings }
        ]
    }
];

export function AppSidebar({ context }: { context: DashboardShopContext }) {
    const pathname = usePathname();
    const { subscription } = context;
    const { limits } = subscription;

    const checkIsActive = (href: string, currentPathname: string) => {
        if (href === "/" || href === "/settings") {
            return currentPathname === href;
        }
        return currentPathname === href || currentPathname.startsWith(`${href}/`);
    };

    return (
        <Sidebar variant="sidebar">
            <SidebarHeader className="h-header border-b">
                <div className="flex items-center gap-2 px-2 py-1">
                    {/* Mohajon logo mark */}
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                        {context.shopName?.[0]}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                            {context.shopName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {subscription.tier} Plan
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {sidebarGroups.map((group) => {
                    const filteredItems = group.items.filter((item) => {
                        // POS System check
                        if (item.href === "/pos" && !limits.pos_system) return false;
                        // Developer API check
                        if (item.href === "/settings/api" && !limits.developer_api) return false;
                        // Tracking check
                        if (item.href === "/settings/tracking" && !limits.marketing_pixels) return false;
                        return true;
                    });

                    if (filteredItems.length === 0) return null;

                    return (
                        <SidebarGroup key={group.label}>
                            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {filteredItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={checkIsActive(item.href, pathname)}
                                            >
                                                <Link href={item.href}>
                                                    <item.icon size={18} />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>

            <SidebarFooter>
                <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="size-8">
                        <AvatarFallback>{context.shopName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                            {context.shopName}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                            {context.role}
                        </span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
