"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { reportCustomer } from "@/lib/api";

const REASONS = [
    { value: "RTO", label: "Return To Origin (RTO)" },
    { value: "FAKE_ORDER", label: "Fake Order / Prank" },
    { value: "HARASSMENT", label: "Harassment" },
    { value: "UNPAID", label: "Unpaid Advanced Fee" },
];

export function ReportCustomerDialog({
    shopId,
    phoneNumber,
    trigger,
}: {
    shopId: string;
    phoneNumber: string;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Please select a reason.");
            return;
        }
        setSubmitting(true);
        const res = await reportCustomer(shopId, {
            phone_number: phoneNumber,
            reason,
            notes: notes.trim(),
        });
        setSubmitting(false);

        if (res.success) {
            toast.success("Customer reported. Thanks for helping keep the network safe.");
            setOpen(false);
            setReason("");
            setNotes("");
        } else {
            toast.error(res.error || "Failed to submit report.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report Customer</DialogTitle>
                    <DialogDescription>
                        Report {phoneNumber || "this customer"} for fraudulent behavior. Reports
                        tied to a genuine order contribute to the shared fraud network.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="report-reason">Reason</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="report-reason">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="report-notes">Notes (optional)</Label>
                        <Textarea
                            id="report-notes"
                            placeholder="Add any context that supports this report..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={submitting}>
                        {submitting && <IconLoader2 className="size-4 animate-spin" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
