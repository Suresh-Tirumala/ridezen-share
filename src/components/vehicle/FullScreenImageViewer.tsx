import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface FullScreenImageViewerProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export function FullScreenImageViewer({
  imageUrl,
  isOpen,
  onClose,
  alt = "Vehicle image",
}: FullScreenImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full w-full p-0 border-none bg-black/95 flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 left-4 z-50 text-white hover:bg-white/20 rounded-full h-10 w-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-full max-w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
