import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MapPin, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HomeTab from "./tabs/HomeTab";
import NearbyTab from "./tabs/NearbyTab";
import SearchTab from "./tabs/SearchTab";
import ProfileTab from "./tabs/ProfileTab";

type TabType = "home" | "nearby" | "search" | "profile";

export default function UserHome() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayTab, setDisplayTab] = useState<TabType>("home");

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      setDisplayTab(newTab);
      setActiveTab(newTab);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handleChatWithOwner = async (ownerId: string, vehicleId: string) => {
    if (!user) {
      toast.error("Please sign in to chat with owner");
      return;
    }

    try {
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("owner_id", ownerId)
        .eq("vehicle_id", vehicleId)
        .single();

      if (existingConvo) {
        toast.info("Opening chat with owner...");
        return;
      }

      const { error } = await supabase.from("conversations").insert({
        user_id: user.id,
        owner_id: ownerId,
        vehicle_id: vehicleId,
      });

      if (error) throw error;
      toast.success("Chat started with owner!");
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat. Please try again.");
    }
  };

  const renderContent = () => {
    switch (displayTab) {
      case "home":
        return <HomeTab onChatWithOwner={handleChatWithOwner} />;
      case "nearby":
        return <NearbyTab onChatWithOwner={handleChatWithOwner} />;
      case "search":
        return <SearchTab onChatWithOwner={handleChatWithOwner} />;
      case "profile":
        return <ProfileTab />;
      default:
        return <HomeTab onChatWithOwner={handleChatWithOwner} />;
    }
  };

  const navItems = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "nearby" as const, icon: MapPin, label: "Nearby" },
    { id: "search" as const, icon: Search, label: "Search" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="animate-fade-in">
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-lg font-bold">{profile?.full_name || "Rider"}</h1>
          </div>
        </div>
      </header>

      {/* Main Content with Page Transition */}
      <main className="p-4">
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            isTransitioning 
              ? "opacity-0 translate-y-4 scale-[0.98]" 
              : "opacity-100 translate-y-0 scale-100"
          )}
        >
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 px-4 py-2 z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200",
                activeTab === item.id 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                activeTab === item.id && "animate-[bounce_0.3s_ease-out]"
              )} />
              <span className={cn(
                "text-xs transition-all duration-200",
                activeTab === item.id && "font-semibold"
              )}>{item.label}</span>
              {activeTab === item.id && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary animate-scale-in" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
