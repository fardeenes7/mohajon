"use client";

import { useState } from "react";
import { IconSparkles, IconLoader2, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { generateProductAiDescription } from "@/lib/api";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

interface ProductAIPrompterProps {
  shopId: string;
  productName: string;
  specifications: Record<string, any>;
  onGenerate: (description: string) => void;
}

export function ProductAIPrompter({
  shopId,
  productName,
  specifications,
  onGenerate,
}: ProductAIPrompterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState("Professional");
  const [preview, setPreview] = useState("");

  const handleGenerate = async () => {
    if (!productName) {
      toast.error("Please enter a product name first.");
      return;
    }

    setIsGenerating(true);
    setPreview("");
    
    try {
      const res = await generateProductAiDescription(shopId, {
        name: productName,
        specifications,
        tone,
      });

      if (!res.success) throw new Error(res.error || "Generation failed");

      setPreview(res.data.description);
      toast.success("AI Description generated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onGenerate(preview);
    setIsOpen(false);
    setPreview("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
        onClick={() => setIsOpen(true)}
      >
        <IconSparkles className="size-4" />
        AI Write
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconSparkles className="size-5 text-primary" />
              AI Product Copywriter
            </DialogTitle>
            <DialogDescription>
              Generate a professional description for <strong>{productName || "this product"}</strong> based on its attributes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tone">Writing Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional & Trustworthy</SelectItem>
                  <SelectItem value="Enthusiastic">Exciting & Energetic</SelectItem>
                  <SelectItem value="Minimalist">Minimalist & Clean</SelectItem>
                  <SelectItem value="Luxury">Luxury & Premium</SelectItem>
                  <SelectItem value="Persuasive">Sales Focused & Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preview && (
              <div className="mt-4 flex flex-col gap-2">
                <Label>AI Preview</Label>
                <div 
                  className="rounded-md border bg-muted/30 p-4 text-sm prose prose-sm max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            {!preview ? (
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Description"
                )}
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPreview("")}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleApply}
                  className="flex-1 gap-2"
                >
                  <IconCheck className="size-4" />
                  Use this Copy
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
