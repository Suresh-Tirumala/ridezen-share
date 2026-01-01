import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Bike, Bus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VehicleType = "car" | "bike" | "auto" | "bus";

const vehicleCategories: { id: VehicleType; label: string; icon: typeof Car; color: string }[] = [
  { id: "car", label: "Cars", icon: Car, color: "text-primary" },
  { id: "bike", label: "Bikes", icon: Bike, color: "text-accent" },
  { id: "auto", label: "Autos", icon: Bus, color: "text-success" },
];

const tourismPackages = [
  { id: 1, title: "Hill Station Adventure", duration: "3 Days", price: 299.99, image: "🏔️" },
  { id: 2, title: "City Tour Express", duration: "1 Day", price: 49.99, image: "🏙️" },
  { id: 3, title: "Coastal Highway Trip", duration: "2 Days", price: 199.99, image: "🏖️" },
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

      {/* Tourism Packages */}
      <section>
        <h2 className="text-lg font-bold mb-3">Tourism Packages</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {tourismPackages.map((pkg) => (
            <Card key={pkg.id} variant="interactive" className="min-w-[200px] flex-shrink-0">
              <CardHeader className="pb-2">
                <div className="text-4xl mb-2">{pkg.image}</div>
                <CardTitle className="text-base">{pkg.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{pkg.duration}</p>
                <p className="text-lg font-bold text-primary">${pkg.price}</p>
              </CardContent>
            </Card>
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
                  <div className="w-32 h-32 bg-muted flex items-center justify-center flex-shrink-0">
                    {vehicle.images && vehicle.images[0] ? (
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-12 w-12 text-muted-foreground" />
                    )}
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
