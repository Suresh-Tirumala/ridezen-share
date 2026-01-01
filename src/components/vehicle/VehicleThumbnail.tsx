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
  const primaryImage = useMemo(() => images?.[0] ?? null, [images]);
  const [isBroken, setIsBroken] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const emoji = emojiForType(vehicleType);
  const hasImage = primaryImage && !isBroken;

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
          <img
            src={primaryImage}
            alt={`${vehicleType} rental vehicle photo`}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setIsBroken(true)}
          />
        ) : (
          <span aria-hidden className="text-2xl">
            {emoji}
          </span>
        )}
      </div>

      <FullScreenImageViewer
        imageUrl={primaryImage}
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        alt={`${vehicleType} rental vehicle`}
      />
    </>
  );
}
