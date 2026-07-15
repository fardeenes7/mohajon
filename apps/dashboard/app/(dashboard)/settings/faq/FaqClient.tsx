"use client";

import { useState } from "react";
import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { IconPlus, IconGripVertical, IconPencil, IconTrash, IconEyeOff } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "sonner";
import { createFaq, updateFaq, deleteFaq } from "@/lib/api";

export function FaqClient({ shopId, initialFaqs }: { shopId: string; initialFaqs: any[] }) {
    const [faqs, setFaqs] = useState<any[]>(initialFaqs);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<any>(null);
    const [formData, setFormData] = useState({ category: "FAQ", question: "", answer: "", is_active: true });
    const [isSaving, setIsSaving] = useState(false);

    const openCreateModal = () => {
        setEditingFaq(null);
        setFormData({ category: "FAQ", question: "", answer: "", is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (faq: any) => {
        setEditingFaq(faq);
        setFormData({
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            is_active: faq.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.question || !formData.answer) {
            toast.error("Question and answer are required.");
            return;
        }

        setIsSaving(true);
        if (editingFaq) {
            const res = await updateFaq(shopId, editingFaq.id, formData);
            if (res.success) {
                setFaqs(faqs.map(f => f.id === editingFaq.id ? res.data : f));
                toast.success("FAQ updated successfully.");
                setIsModalOpen(false);
            } else {
                toast.error(res.error || "Failed to update FAQ.");
            }
        } else {
            const res = await createFaq(shopId, formData);
            if (res.success) {
                setFaqs([...faqs, res.data]);
                toast.success("FAQ created successfully.");
                setIsModalOpen(false);
            } else {
                toast.error(res.error || "Failed to create FAQ.");
            }
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this FAQ?")) return;
        
        const res = await deleteFaq(shopId, id);
        if (res.success) {
            setFaqs(faqs.filter(f => f.id !== id));
            toast.success("FAQ deleted.");
        } else {
            toast.error(res.error || "Failed to delete FAQ.");
        }
    };

    const toggleActive = async (faq: any) => {
        const res = await updateFaq(shopId, faq.id, { is_active: !faq.is_active });
        if (res.success) {
            setFaqs(faqs.map(f => f.id === faq.id ? res.data : f));
            toast.success(res.data.is_active ? "FAQ activated." : "FAQ deactivated.");
        } else {
            toast.error(res.error || "Failed to update status.");
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">FAQ & Policies</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your shop's frequently asked questions and policies. These are used by the AI Chatbot to answer customer queries automatically.
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <IconPlus className="size-4 mr-2" />
                    Add Entry
                </Button>
            </div>

            <div className="flex flex-col gap-4">
                {faqs.map((faq) => (
                    <Card key={faq.id} className={!faq.is_active ? "opacity-60" : ""}>
                        <div className="flex p-4 gap-4 items-start">
                            <div className="cursor-grab mt-1 text-muted-foreground">
                                <IconGripVertical className="size-5" />
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                                            {!faq.is_active && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                                        </div>
                                        <h3 className="font-medium text-sm">{faq.question}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => toggleActive(faq)} title="Toggle active">
                                            <IconEyeOff className={`size-4 ${faq.is_active ? "text-muted-foreground" : "text-primary"}`} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditModal(faq)}>
                                            <IconPencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDelete(faq.id)}>
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
                {faqs.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                        No FAQs found. Create one to get started!
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ Entry"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Category</Label>
                            <Input
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Question</Label>
                            <Input
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Answer</Label>
                            <Textarea
                                rows={5}
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
