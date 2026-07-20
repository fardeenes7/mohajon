"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@repo/ui/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Avatar, AvatarFallback } from "@repo/ui/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import { IconDotsVertical, IconUserPlus, IconAlertTriangle } from "@tabler/icons-react";
import {
    inviteShopMember,
    updateShopMemberRole,
    removeShopMember,
} from "@/lib/api";

export type ShopMember = {
    id: string;
    role: string;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
    };
    created_at?: string;
};

const ROLES = [
    { value: "OWNER", label: "Owner" },
    { value: "MANAGER", label: "Manager" },
    { value: "INVENTORY_MANAGER", label: "Inventory Manager" },
    { value: "CASHIER", label: "Cashier" },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
    ROLES.map((r) => [r.value, r.label]),
);

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
    OWNER: "default",
    MANAGER: "secondary",
    INVENTORY_MANAGER: "outline",
    CASHIER: "outline",
};

function initials(m: ShopMember): string {
    const f = m.user.first_name?.[0] ?? "";
    const l = m.user.last_name?.[0] ?? "";
    return (f + l || m.user.email[0] || "?").toUpperCase();
}

function fullName(m: ShopMember): string {
    const name = `${m.user.first_name ?? ""} ${m.user.last_name ?? ""}`.trim();
    return name || m.user.email;
}

export function TeamClient({
    shopId,
    currentRole,
    members,
    loadFailed,
}: {
    shopId: string;
    currentRole: string;
    members: ShopMember[];
    loadFailed: boolean;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const isOwner = currentRole === "OWNER";

    // Invite dialog state
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("CASHIER");
    const [inviting, setInviting] = useState(false);

    // Remove confirmation state
    const [removeTarget, setRemoveTarget] = useState<ShopMember | null>(null);
    const [removing, setRemoving] = useState(false);

    const refresh = () => startTransition(() => router.refresh());

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            toast.error("Enter an email address.");
            return;
        }
        setInviting(true);
        const res = await inviteShopMember(shopId, {
            email: inviteEmail.trim(),
            role: inviteRole,
        });
        setInviting(false);
        if (res.success) {
            toast.success(`${inviteEmail.trim()} added to the team.`);
            setInviteOpen(false);
            setInviteEmail("");
            setInviteRole("CASHIER");
            refresh();
        } else {
            toast.error(res.error || "Failed to add member.");
        }
    };

    const handleRoleChange = async (member: ShopMember, role: string) => {
        if (role === member.role) return;
        const res = await updateShopMemberRole(shopId, member.id, role);
        if (res.success) {
            toast.success(`${fullName(member)} is now ${ROLE_LABELS[role] ?? role}.`);
            refresh();
        } else {
            toast.error(res.error || "Failed to update role.");
        }
    };

    const handleRemove = async () => {
        if (!removeTarget) return;
        setRemoving(true);
        const res = await removeShopMember(shopId, removeTarget.id);
        setRemoving(false);
        if (res.success) {
            toast.success(`${fullName(removeTarget)} removed from the team.`);
            setRemoveTarget(null);
            refresh();
        } else {
            toast.error(res.error || "Failed to remove member.");
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Team & Roles
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage who can access this store and what they can do.
                    </p>
                </div>
                {isOwner && (
                    <Button onClick={() => setInviteOpen(true)}>
                        <IconUserPlus className="size-4 mr-2" />
                        Add member
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                        {isOwner
                            ? "Owners can add members, change roles, and remove access."
                            : "Only shop owners can change team membership."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadFailed ? (
                        <div className="flex items-center gap-2 text-sm text-destructive py-6">
                            <IconAlertTriangle className="size-4" />
                            Couldn&apos;t load team members. Try refreshing.
                        </div>
                    ) : members.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6">
                            No team members yet.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    {isOwner && (
                                        <TableHead className="w-[60px] text-right">
                                            Actions
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-8">
                                                    <AvatarFallback className="text-xs">
                                                        {initials(m)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate">
                                                        {fullName(m)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {m.user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    ROLE_VARIANTS[m.role] ??
                                                    "outline"
                                                }
                                            >
                                                {ROLE_LABELS[m.role] ?? m.role}
                                            </Badge>
                                        </TableCell>
                                        {isOwner && (
                                            <TableCell className="text-right">
                                                <MemberActions
                                                    member={m}
                                                    onRoleChange={handleRoleChange}
                                                    onRemove={() =>
                                                        setRemoveTarget(m)
                                                    }
                                                />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Invite dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add team member</DialogTitle>
                        <DialogDescription>
                            The person must already have a Mohajon account. Enter
                            their email to grant access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="teammate@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="invite-role">Role</Label>
                            <Select
                                value={inviteRole}
                                onValueChange={setInviteRole}
                            >
                                <SelectTrigger id="invite-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.filter(
                                        (r) => r.value !== "OWNER",
                                    ).map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setInviteOpen(false)}
                            disabled={inviting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={inviting}>
                            {inviting ? "Adding..." : "Add member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove confirmation */}
            <AlertDialog
                open={!!removeTarget}
                onOpenChange={(open) => !open && setRemoveTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {removeTarget
                                ? `${fullName(removeTarget)} will lose access to this store. This can be undone by re-adding them.`
                                : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removing}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleRemove();
                            }}
                            disabled={removing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removing ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isPending && (
                <span className="sr-only" role="status">
                    Updating team...
                </span>
            )}
        </div>
    );
}

function MemberActions({
    member,
    onRoleChange,
    onRemove,
}: {
    member: ShopMember;
    onRoleChange: (member: ShopMember, role: string) => void;
    onRemove: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Open actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Change role</DropdownMenuLabel>
                {ROLES.map((r) => (
                    <DropdownMenuItem
                        key={r.value}
                        disabled={r.value === member.role}
                        onClick={() => onRoleChange(member, r.value)}
                    >
                        {r.label}
                        {r.value === member.role && (
                            <span className="ml-auto text-xs text-muted-foreground">
                                Current
                            </span>
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onRemove}
                    className="text-destructive focus:text-destructive"
                >
                    Remove from team
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
