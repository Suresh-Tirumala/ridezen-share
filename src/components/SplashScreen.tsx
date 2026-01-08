import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import splashVideo from "@/assets/RideRentLOGO_Animated.mp4";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after video ends or fallback timeout
    const timeout = setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        navigate("/");
      }
    }, 3000); // Fallback timeout

    return () => clearTimeout(timeout);
  }, [navigate, onComplete]);

  const handleVideoEnd = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <video
        src={splashVideo}
        autoPlay
        playsInline
        muted
        onEnded={handleVideoEnd}
        className="w-auto h-auto max-w-[90vw] max-h-[70vh] object-contain md:max-w-[60vw] md:max-h-[60vh] lg:max-w-[50vw] lg:max-h-[50vh]"
      />
    </div>
  )
}

