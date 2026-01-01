import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Car, MessageCircle, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  price_per_day: number;
  images: string[] | null;
  owner_id: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

interface NearbyTabProps {
  onChatWithOwner: (ownerId: string, vehicleId: string) => void;
}

export default function NearbyTab({ onChatWithOwner }: NearbyTabProps) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const enableLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationEnabled(true);
        toast.success("Location enabled!");
        fetchNearbyVehicles(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get your location. Please enable location permissions.");
        setLoading(false);
      }
    );
  };

  const fetchNearbyVehicles = async (lat: number, lng: number) => {
    try {
      // Fetch all available vehicles (in production, you'd use PostGIS for distance filtering)
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("is_available", true)
        .eq("is_disabled", false)
        .not("location_lat", "is", null)
        .not("location_lng", "is", null);

      if (error) throw error;

      // Calculate distance and sort by nearest
      const vehiclesWithDistance = (data || []).map((vehicle) => {
        const distance = calculateDistance(
          lat,
          lng,
          vehicle.location_lat!,
          vehicle.location_lng!
        );
        return { ...vehicle, distance };
      });

      // Sort by distance and take nearest 20
      vehiclesWithDistance.sort((a, b) => a.distance - b.distance);
      setVehicles(vehiclesWithDistance.slice(0, 20));
    } catch (error) {
      console.error("Error fetching nearby vehicles:", error);
      toast.error("Failed to load nearby vehicles");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!locationEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Navigation className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Enable Location</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-xs">
          Allow location access to find vehicles near you
        </p>
        <Button onClick={enableLocation} disabled={loading} className="gap-2">
          <MapPin className="h-4 w-4" />
          {loading ? "Getting Location..." : "Enable Location"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <MapPin className="h-4 w-4 text-primary" />
        <span>Showing vehicles near your location</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <Card variant="glass" className="p-6 text-center">
          <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No vehicles found nearby</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vehicles.map((vehicle: Vehicle & { distance?: number }) => (
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
                  {'distance' in vehicle && vehicle.distance !== undefined && (
                    <p className="text-xs text-primary mt-1">
                      {vehicle.distance.toFixed(1)} km away
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-lg font-bold text-primary">₹{vehicle.price_per_day}/day</p>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
