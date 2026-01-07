import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Phone, 
  Mail, 
  Car, 
  MessageCircle, 
  IndianRupee, 
  TrendingUp,
  Calendar,
  LogOut,
  Edit2,
  Navigation
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import VehicleTrackingSheet from "./VehicleTrackingSheet";

interface Vehicle {
  id: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  price_per_day: number;
  images: string[] | null;
  is_available: boolean | null;
  is_disabled: boolean | null;
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string | null;
  vehicle_id: string;
  user_id: string;
  user_name?: string;
}

interface Conversation {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  updated_at: string;
  user_name?: string;
  last_message?: string;
  unread_count?: number;
}

interface OwnerProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onOpenChat: (conversationId: string) => void;
}

export default function OwnerProfileSheet({ 
  isOpen, 
  onClose, 
  vehicles,
  onOpenChat 
}: OwnerProfileSheetProps) {
  const { user, profile, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [trackingSheetOpen, setTrackingSheetOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchOwnerData();
    }
  }, [isOpen, user]);

  const fetchOwnerData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch bookings for owner's vehicles
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (bookingsError) throw bookingsError;

      // Fetch user names for bookings
      const bookingsWithUsers = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", booking.user_id)
            .maybeSingle();
          return { ...booking, user_name: userData?.full_name || "User" };
        })
      );

      setBookings(bookingsWithUsers);

      // Calculate total earnings from completed bookings
      const earnings = bookingsWithUsers
        .filter(b => b.status === "completed" || b.status === "confirmed")
        .reduce((sum, b) => sum + Number(b.total_price), 0);
      setTotalEarnings(earnings);

      // Fetch conversations
      const { data: convosData, error: convosError } = await supabase
        .from("conversations")
        .select("*")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (convosError) throw convosError;

      // Fetch user names and last messages for conversations
      const convosWithDetails = await Promise.all(
        (convosData || []).map(async (convo) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", convo.user_id)
            .maybeSingle();

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, sender_id, is_read")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .neq("sender_id", user.id)
            .eq("is_read", false);

          return {
            ...convo,
            user_name: userData?.full_name || "User",
            last_message: lastMsg?.content || "No messages yet",
            unread_count: count || 0,
          };
        })
      );

      setConversations(convosWithDetails);
    } catch (error) {
      console.error("Error fetching owner data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleEmoji = (type: string) => {
    switch (type) {
      case "car": return "🚗";
      case "bike": return "🏍️";
      case "auto": return "🛺";
      case "bus": return "🚌";
      default: return "🚗";
    }
  };

  const availableVehicles = vehicles.filter(v => v.is_available && !v.is_disabled);
  const rentedVehicles = vehicles.filter(v => !v.is_available && !v.is_disabled);
  const disabledVehicles = vehicles.filter(v => v.is_disabled);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>My Profile</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {/* Profile Info */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{profile?.full_name || "Owner"}</h3>
                  <p className="text-sm text-muted-foreground">Vehicle Owner</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2">
                {profile?.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 text-center">
                <Car className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{vehicles.length}</p>
                <p className="text-xs text-muted-foreground">Total Vehicles</p>
              </Card>
              <Card className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
                <p className="text-2xl font-bold flex items-center justify-center">
                  <IndianRupee className="h-4 w-4" />
                  {totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </Card>
            </div>

            {/* Vehicle Status Breakdown */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Status
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                  <span className="text-sm">Available for Rent</span>
                  <span className="font-semibold text-success">{availableVehicles.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-warning/10">
                  <span className="text-sm">Currently Rented</span>
                  <span className="font-semibold text-warning">{rentedVehicles.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="text-sm">Disabled</span>
                  <span className="font-semibold text-muted-foreground">{disabledVehicles.length}</span>
                </div>
              </div>

              {/* Track My Vehicles Button */}
              <Button
                variant="outline"
                className="w-full mt-3 gap-2"
                onClick={() => setTrackingSheetOpen(true)}
              >
                <Navigation className="h-4 w-4" />
                Track My Vehicles {rentedVehicles.length > 0 && `(${rentedVehicles.length})`}
              </Button>
            </Card>

            {/* My Vehicles */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3">My Vehicles</h4>
              {vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No vehicles added yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {vehicles.slice(0, 5).map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                        {vehicle.images?.[0] ? (
                          <img src={vehicle.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{getVehicleEmoji(vehicle.vehicle_type)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-primary">₹{vehicle.price_per_day}/day</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        vehicle.is_disabled 
                          ? "bg-muted text-muted-foreground" 
                          : vehicle.is_available 
                            ? "bg-success/10 text-success" 
                            : "bg-warning/10 text-warning"
                      }`}>
                        {vehicle.is_disabled ? "Off" : vehicle.is_available ? "Live" : "Rented"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Bookings */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Bookings
              </h4>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{booking.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold flex items-center justify-end">
                          <IndianRupee className="h-3 w-3" />
                          {booking.total_price}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          booking.status === "confirmed" ? "bg-success/10 text-success" :
                          booking.status === "pending" ? "bg-warning/10 text-warning" :
                          booking.status === "completed" ? "bg-primary/10 text-primary" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                          {booking.status || "pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Chats */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </h4>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => {
                        onOpenChat(convo.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{convo.user_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{convo.last_message}</p>
                      </div>
                      {convo.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {convo.unread_count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Sign Out */}
            <Button variant="outline" onClick={signOut} className="w-full gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}

        {/* Vehicle Tracking Sheet */}
        <VehicleTrackingSheet
          isOpen={trackingSheetOpen}
          onClose={() => setTrackingSheetOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
