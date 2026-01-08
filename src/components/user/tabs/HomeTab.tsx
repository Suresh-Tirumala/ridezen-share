import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Bike, Bus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";
import dashboardVideo from "@/assets/RIDERENT_user_dashboard_1.mp4";
type VehicleType = "car" | "bike" | "auto" | "bus";

const vehicleCategories: { id: VehicleType; label: string; icon: typeof Car; color: string }[] = [
  { id: "car", label: "Cars", icon: Car, color: "text-primary" },
  { id: "bike", label: "Bikes", icon: Bike, color: "text-accent" },
  { id: "auto", label: "Autos", icon: Bus, color: "text-success" },
];


interface Vehicle {
  id: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  price_per_day: number;
  images: string[] | null;
  owner_id: string;
  location_address: string | null;
}

interface HomeTabProps {
  onChatWithOwner: (ownerId: string, vehicleId: string) => void;
  onViewOwner: (ownerId: string) => void;
}

export default function HomeTab({ onChatWithOwner, onViewOwner }: HomeTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<VehicleType | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [selectedCategory]);

  // Subscribe to realtime vehicle changes
  useEffect(() => {
    const channel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
        },
        () => {
          // Refetch vehicles when any change happens
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vehicles")
        .select("*")
        .eq("is_available", true)
        .eq("is_disabled", false);

      if (selectedCategory) {
        query = query.eq("vehicle_type", selectedCategory);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Promo Video */}
      <section>
        <video
          src={dashboardVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-48 sm:h-56 md:h-60 lg:h-72 object-cover rounded-xl shadow-lg"
        />
      </section>

      {/* Vehicle Categories */}
      <section>
        <h2 className="text-lg font-bold mb-3">Browse by Category</h2>
        <div className="grid grid-cols-3 gap-3">
          {vehicleCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                selectedCategory === category.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <category.icon className={cn("h-8 w-8", category.color)} />
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </section>


      {/* Vehicles to Rent */}
      <section>
        <h2 className="text-lg font-bold mb-3">
          {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s Available` : "Vehicles to Rent"}
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vehicles.length === 0 ? (
          <Card variant="glass" className="p-6 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No vehicles available right now</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} variant="interactive" className="overflow-hidden">
                <div className="flex">
                  <div className="w-32 h-32 bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <VehicleThumbnail 
                      vehicleType={vehicle.vehicle_type} 
                      images={vehicle.images} 
                      className="w-full h-full rounded-none"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <h3 className="font-semibold">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">{vehicle.vehicle_type}</p>
                    {vehicle.location_address && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{vehicle.location_address}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-bold text-primary">₹{vehicle.price_per_day}/day</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewOwner(vehicle.owner_id)}
                          className="gap-1"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onChatWithOwner(vehicle.owner_id, vehicle.id)}
                          className="gap-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
