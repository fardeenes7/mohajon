"use client";

import { useState } from "react";
import { IconPhotoSpark, IconLoader2, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { generateProductAiImage } from "@/lib/api";
import { Button } from "@repo/ui/components/ui/button";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Label } from "@repo/ui/components/ui/label";

interface ProductAIImageGenProps {
  shopId: string;
  productName: string;
  onImageGenerated: (mediaId: string) => void;
}

export function ProductAIImageGen({
  shopId,
  productName,
  onImageGenerated,
}: ProductAIImageGenProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState(`A professional product photography of ${productName}, studio lighting, high resolution, minimalist background.`);
  const [previewUrl, setPreviewUrl] = useState("");
  const [generatedMediaId, setGeneratedMediaId] = useState("");

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt.");
      return;
    }

    setIsGenerating(true);
    setPreviewUrl("");
    
    try {
      const res = await generateProductAiImage(shopId, { prompt });

      if (!res.success) throw new Error(res.error || "Generation failed");

      setPreviewUrl(res.data.cdn_url);
      setGeneratedMediaId(res.data.media.id);
      toast.success("AI Image generated and saved!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onImageGenerated(generatedMediaId);
    setIsOpen(false);
    setPreviewUrl("");
    setGeneratedMediaId("");
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
        <IconPhotoSpark className="size-4" />
        AI Generate
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconPhotoSpark className="size-5 text-primary" />
              AI Image Studio
            </DialogTitle>
            <DialogDescription>
              Describe the image you want to generate for <strong>{productName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="image-prompt">Image Description</Label>
              <Textarea
                id="image-prompt"
                placeholder="e.g. A sleek black smartphone on a marble table..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            {previewUrl && (
              <div className="mt-4 flex flex-col gap-2">
                <Label>Generated Image</Label>
                <div className="overflow-hidden rounded-md border bg-muted/30">
                  <img 
                    src={previewUrl} 
                    alt="AI Generated" 
                    className="aspect-square w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {!previewUrl ? (
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Generating & Saving...
                  </>
                ) : (
                  "Generate & Save to Media"
                )}
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPreviewUrl("")}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleApply}
                  className="flex-1 gap-2"
                >
                  <IconPlus className="size-4" />
                  Add to Product
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
