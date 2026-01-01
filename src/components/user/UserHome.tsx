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

  const handleChatWithOwner = async (ownerId: string, vehicleId: string) => {
    if (!user) {
      toast.error("Please sign in to chat with owner");
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("owner_id", ownerId)
        .eq("vehicle_id", vehicleId)
        .single();

      if (existingConvo) {
        toast.info("Opening chat with owner...");
        // In a full implementation, this would navigate to the chat screen
        return;
      }

      // Create new conversation
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
    switch (activeTab) {
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
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-lg font-bold">{profile?.full_name || "Rider"}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 animate-fade-in">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
