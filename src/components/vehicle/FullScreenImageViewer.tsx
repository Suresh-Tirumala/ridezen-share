import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface FullScreenImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export function FullScreenImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  alt = "Vehicle image",
}: FullScreenImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset to initial index when opening or when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  if (!images || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentIndex];

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full w-full p-0 border-none bg-black/95 flex items-center justify-center">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 left-4 z-50 text-white hover:bg-white/20 rounded-full h-10 w-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        {/* Image counter */}
        {hasMultipleImages && (
          <div className="absolute top-4 right-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Previous button */}
        {hasMultipleImages && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Main image */}
        <img
          src={currentImage}
          alt={`${alt} ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain animate-fade-in"
          key={currentIndex}
        />

        {/* Next button */}
        {hasMultipleImages && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Dot indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white scale-110"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
