import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FullScreenImageViewer } from "./FullScreenImageViewer";

type VehicleType = "car" | "bike" | "auto" | "bus" | string;

function emojiForType(type: VehicleType) {
  switch (type) {
    case "car":
      return "🚗";
    case "bike":
      return "🏍️";
    case "auto":
      return "🛺";
    case "bus":
      return "🚌";
    default:
      return "🚘";
  }
}

export function VehicleThumbnail({
  vehicleType,
  images,
  className,
}: {
  vehicleType: VehicleType;
  images?: string[] | null;
  className?: string;
}) {
  const validImages = useMemo(() => images?.filter(Boolean) ?? [], [images]);
  const primaryImage = validImages[0] ?? null;
  const [isBroken, setIsBroken] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const emoji = emojiForType(vehicleType);
  const hasImage = primaryImage && !isBroken;
  const hasMultipleImages = validImages.length > 1;

  return (
    <>
      <div
        className={cn(
          "relative h-12 w-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center",
          hasImage && "cursor-pointer",
          className
        )}
        aria-label={`${vehicleType} thumbnail`}
        onClick={() => hasImage && setIsFullScreen(true)}
      >
        {hasImage ? (
          <>
            <img
              src={primaryImage}
              alt={`${vehicleType} rental vehicle photo`}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setIsBroken(true)}
            />
            {/* Multiple images indicator */}
            {hasMultipleImages && (
              <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                +{validImages.length - 1}
              </div>
            )}
          </>
        ) : (
          <span aria-hidden className="text-2xl">
            {emoji}
          </span>
        )}
      </div>

      <FullScreenImageViewer
        images={validImages}
        initialIndex={0}
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        alt={`${vehicleType} rental vehicle`}
      />
    </>
  );
}
