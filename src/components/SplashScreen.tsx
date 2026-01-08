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
      <div className="w-full max-w-sm animate-scale-in">
        <video
          src={splashVideo}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
