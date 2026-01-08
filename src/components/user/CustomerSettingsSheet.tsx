import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  FileText,
  Mail,
  Phone,
  Save,
  Loader2,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface CustomerSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerSettingsSheet({ isOpen, onClose }: CustomerSettingsSheetProps) {
  const { profile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    bookingUpdates: true,
    newMessages: true,
    promotions: false,
    reminders: true,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile(profileData);
      if (error) throw error;
      toast.success("Profile updated successfully");
      setActiveSection(null);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
    setActiveSection(null);
  };

  const settingsItems = [
    {
      id: "profile",
      icon: User,
      title: "Edit Profile",
      description: "Update your name, phone, and photo",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Manage notification preferences",
    },
    {
      id: "security",
      icon: Shield,
      title: "Security",
      description: "Password and account security",
    },
    {
      id: "help",
      icon: HelpCircle,
      title: "Help & Support",
      description: "FAQs and contact support",
    },
    {
      id: "terms",
      icon: FileText,
      title: "Terms & Privacy",
      description: "Legal documents and policies",
    },
  ];

  const renderMainMenu = () => (
    <div className="space-y-2">
      {settingsItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveSection(item.id)}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <item.icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      ))}

      {/* Theme Toggle */}
      <Card className="p-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium">Dark Mode</span>
          </div>
          <Switch 
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </Card>
    </div>
  );

  const renderProfileSection = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setActiveSection(null)}
        className="text-sm text-primary flex items-center gap-1"
      >
        ← Back to Settings
      </button>

      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-primary" />
          )}
        </div>
        <Button variant="outline" size="sm">Change Photo</Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="full_name"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              className="pl-10"
              placeholder="Enter your name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              value={profile?.email || ""}
              disabled
              className="pl-10 bg-muted"
            />
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="pl-10"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <Button onClick={handleSaveProfile} className="w-full gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setActiveSection(null)}
        className="text-sm text-primary flex items-center gap-1"
      >
        ← Back to Settings
      </button>

      <div className="space-y-4">
        <h3 className="font-semibold">Booking Notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Booking Updates</p>
              <p className="text-xs text-muted-foreground">Get notified about your booking status</p>
            </div>
            <Switch 
              checked={notifications.bookingUpdates}
              onCheckedChange={(checked) => setNotifications({ ...notifications, bookingUpdates: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">New Messages</p>
              <p className="text-xs text-muted-foreground">Get notified for new chat messages</p>
            </div>
            <Switch 
              checked={notifications.newMessages}
              onCheckedChange={(checked) => setNotifications({ ...notifications, newMessages: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Rental Reminders</p>
              <p className="text-xs text-muted-foreground">Reminders before rental start/end</p>
            </div>
            <Switch 
              checked={notifications.reminders}
              onCheckedChange={(checked) => setNotifications({ ...notifications, reminders: checked })}
            />
          </div>
        </div>

        <Separator />

        <h3 className="font-semibold">Marketing</h3>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Promotions & Offers</p>
            <p className="text-xs text-muted-foreground">Receive special deals and discounts</p>
          </div>
          <Switch 
            checked={notifications.promotions}
            onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
          />
        </div>

        <Button onClick={handleSaveNotifications} className="w-full gap-2">
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setActiveSection(null)}
        className="text-sm text-primary flex items-center gap-1"
      >
        ← Back to Settings
      </button>

      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Add extra security to your account</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Login Activity</p>
            <p className="text-xs text-muted-foreground">See where you're logged in</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <Separator />

      <Button variant="destructive" className="w-full">
        Delete Account
      </Button>
    </div>
  );

  const renderHelpSection = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setActiveSection(null)}
        className="text-sm text-primary flex items-center gap-1"
      >
        ← Back to Settings
      </button>

      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">FAQs</p>
            <p className="text-xs text-muted-foreground">Frequently asked questions</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Contact Support</p>
            <p className="text-xs text-muted-foreground">Get help from our team</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Report a Problem</p>
            <p className="text-xs text-muted-foreground">Let us know about issues</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">App Version 1.0.0</p>
      </Card>
    </div>
  );

  const renderTermsSection = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setActiveSection(null)}
        className="text-sm text-primary flex items-center gap-1"
      >
        ← Back to Settings
      </button>

      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Terms of Service</p>
            <p className="text-xs text-muted-foreground">Read our terms and conditions</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Privacy Policy</p>
            <p className="text-xs text-muted-foreground">How we handle your data</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
          <div>
            <p className="font-medium">Cookie Policy</p>
            <p className="text-xs text-muted-foreground">About cookies we use</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "notifications":
        return renderNotificationsSection();
      case "security":
        return renderSecuritySection();
      case "help":
        return renderHelpSection();
      case "terms":
        return renderTermsSection();
      default:
        return renderMainMenu();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {activeSection ? settingsItems.find(i => i.id === activeSection)?.title || "Settings" : "Settings"}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100%-4rem)] pb-8">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
