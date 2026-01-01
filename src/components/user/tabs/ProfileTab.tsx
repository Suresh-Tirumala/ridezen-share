import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Phone, 
  Mail, 
  Car, 
  CreditCard, 
  Edit2, 
  Save, 
  X, 
  Calendar,
  IndianRupee,
  LogOut,
  History
} from "lucide-react";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string | null;
  vehicle_id: string;
  vehicle: {
    brand: string | null;
    model: string | null;
    vehicle_type: string;
    images: string[] | null;
  } | null;
}

interface VehicleHistory {
  id: string;
  brand: string | null;
  model: string | null;
  vehicle_type: string;
  images: string[] | null;
  rental_count: number;
  last_rented: string;
}

export default function ProfileTab() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchVehicleHistory();
    }
  }, [user]);

  useEffect(() => {
    setEditData({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    });
  }, [profile]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          vehicle_id
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch vehicle details separately for each booking
      const bookingsWithVehicles = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: vehicleData } = await supabase
            .from("vehicles")
            .select("brand, model, vehicle_type, images")
            .eq("id", booking.vehicle_id)
            .maybeSingle();
          
          return {
            ...booking,
            vehicle: vehicleData
          };
        })
      );
      
      setBookings(bookingsWithVehicles);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchVehicleHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          vehicle_id,
          start_date
        `)
        .eq("user_id", user?.id)
        .order("start_date", { ascending: false });

      if (error) throw error;

      // Get unique vehicles with rental count
      const vehicleMap = new Map<string, { count: number; lastRented: string }>();
      (data || []).forEach((booking) => {
        const existing = vehicleMap.get(booking.vehicle_id);
        if (existing) {
          existing.count++;
        } else {
          vehicleMap.set(booking.vehicle_id, { count: 1, lastRented: booking.start_date });
        }
      });

      // Fetch vehicle details for unique vehicles
      const vehicleIds = Array.from(vehicleMap.keys());
      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("id, brand, model, vehicle_type, images")
          .in("id", vehicleIds);

        const historyData: VehicleHistory[] = (vehicles || []).map((v) => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          vehicle_type: v.vehicle_type,
          images: v.images,
          rental_count: vehicleMap.get(v.id)?.count || 1,
          last_rented: vehicleMap.get(v.id)?.lastRented || ""
        }));

        setVehicleHistory(historyData);
      }
    } catch (error) {
      console.error("Error fetching vehicle history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(editData);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      setIsEditing(false);
    }
    setSaving(false);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-warning/10 text-warning";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      case "completed":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Profile
          </CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{profile?.full_name || "User"}</h3>
              <p className="text-sm text-muted-foreground">Customer Account</p>
            </div>
          </div>

          {/* Editable Fields */}
          {isEditing ? (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile?.email || user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile?.phone || "Not provided"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rented Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            My Rentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBookings ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rental history yet
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center">
                    {booking.vehicle?.images?.[0] ? (
                      <img
                        src={booking.vehicle.images[0]}
                        alt="Vehicle"
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Car className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {booking.vehicle?.brand} {booking.vehicle?.model}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(booking.start_date).toLocaleDateString()} -{" "}
                      {new Date(booking.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm flex items-center justify-end">
                      <IndianRupee className="h-3 w-3" />
                      {booking.total_price}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(booking.status)}`}
                    >
                      {booking.status || "pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Vehicle History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vehicleHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No vehicles rented yet
            </p>
          ) : (
            <div className="space-y-3">
              {vehicleHistory.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <VehicleThumbnail
                    images={vehicle.images}
                    vehicleType={vehicle.vehicle_type}
                    className="w-12 h-12"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {vehicle.vehicle_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {vehicle.rental_count}x rented
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last: {new Date(vehicle.last_rented).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-3">
            <CreditCard className="h-4 w-4" />
            Add Payment Method
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3">
            <IndianRupee className="h-4 w-4" />
            Payment History
          </Button>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Secure online payments for vehicle rentals
          </p>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button variant="outline" onClick={signOut} className="w-full gap-2 text-destructive">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
