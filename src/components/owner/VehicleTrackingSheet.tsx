import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Car, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface RentedVehicle {
  id: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  registration_number: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  renter_name?: string;
  booking_end_date?: string;
}

interface VehicleTrackingSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // We'll use existing token or need Mapbox

export default function VehicleTrackingSheet({ isOpen, onClose }: VehicleTrackingSheetProps) {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [rentedVehicles, setRentedVehicles] = useState<RentedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<RentedVehicle | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    // Check for Mapbox token
    const token = import.meta.env.VITE_MAPBOX_TOKEN || localStorage.getItem("mapbox_token") || "";
    setMapboxToken(token);
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      fetchRentedVehicles();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen && mapboxToken && rentedVehicles.length > 0 && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [isOpen, mapboxToken, rentedVehicles]);

  const fetchRentedVehicles = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch vehicles that are currently rented (is_available = false)
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_available", false)
        .eq("is_disabled", false);

      if (vehiclesError) throw vehiclesError;

      // Fetch active bookings for these vehicles
      const vehicleIds = (vehicles || []).map(v => v.id);
      const today = new Date().toISOString().split('T')[0];

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .gte("end_date", today)
        .eq("status", "confirmed");

      if (bookingsError) throw bookingsError;

      // Get renter names
      const rentedVehiclesWithDetails = await Promise.all(
        (vehicles || []).map(async (vehicle) => {
          const booking = (bookings || []).find(b => b.vehicle_id === vehicle.id);
          let renterName = "Unknown";

          if (booking) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", booking.user_id)
              .maybeSingle();
            renterName = profile?.full_name || "User";
          }

          return {
            ...vehicle,
            renter_name: renterName,
            booking_end_date: booking?.end_date,
          };
        })
      );

      setRentedVehicles(rentedVehiclesWithDetails);
    } catch (error) {
      console.error("Error fetching rented vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const vehiclesWithLocation = rentedVehicles.filter(v => v.location_lat && v.location_lng);
    
    if (vehiclesWithLocation.length === 0) return;

    const center: [number, number] = [
      vehiclesWithLocation[0].location_lng!,
      vehiclesWithLocation[0].location_lat!,
    ];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add markers for each vehicle
    vehiclesWithLocation.forEach((vehicle) => {
      const el = document.createElement("div");
      el.className = "vehicle-marker";
      el.innerHTML = getVehicleEmoji(vehicle.vehicle_type);
      el.style.fontSize = "24px";
      el.style.cursor = "pointer";
      el.style.background = "white";
      el.style.borderRadius = "50%";
      el.style.padding = "8px";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([vehicle.location_lng!, vehicle.location_lat!])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>${vehicle.brand || ""} ${vehicle.model || ""}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">${vehicle.registration_number}</p>
              <p style="margin: 4px 0; font-size: 12px;">Rented by: ${vehicle.renter_name}</p>
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all vehicles
    if (vehiclesWithLocation.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      vehiclesWithLocation.forEach((v) => {
        bounds.extend([v.location_lng!, v.location_lat!]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
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

  const focusOnVehicle = (vehicle: RentedVehicle) => {
    if (map.current && vehicle.location_lat && vehicle.location_lng) {
      map.current.flyTo({
        center: [vehicle.location_lng, vehicle.location_lat],
        zoom: 15,
        duration: 1000,
      });
      setSelectedVehicle(vehicle);
    }
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      localStorage.setItem("mapbox_token", tokenInput.trim());
      setMapboxToken(tokenInput.trim());
    }
  };

  const handleRefresh = () => {
    // Clear existing map and markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    fetchRentedVehicles();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Reset map when sheet closes
  useEffect(() => {
    if (!isOpen) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Track My Vehicles
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !mapboxToken ? (
          <Card className="p-4">
            <h4 className="font-semibold mb-2">Mapbox Token Required</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Enter your Mapbox public token to enable vehicle tracking. Get one at{" "}
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                mapbox.com
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="pk.eyJ..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={handleTokenSubmit} size="sm">
                Save
              </Button>
            </div>
          </Card>
        ) : rentedVehicles.length === 0 ? (
          <Card className="p-8 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h4 className="font-semibold mb-1">No Rented Vehicles</h4>
            <p className="text-sm text-muted-foreground">
              When your vehicles are rented out, you can track their last known location here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Map */}
            <Card className="overflow-hidden">
              <div ref={mapContainer} className="h-64 w-full" />
            </Card>

            {/* Vehicle List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Currently Rented ({rentedVehicles.length})
              </h4>
              {rentedVehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedVehicle?.id === vehicle.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => focusOnVehicle(vehicle)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                      {getVehicleEmoji(vehicle.vehicle_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{vehicle.registration_number}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{vehicle.location_address || "Location not set"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">Rented by</p>
                      <p className="text-sm">{vehicle.renter_name}</p>
                      {vehicle.booking_end_date && (
                        <p className="text-xs text-muted-foreground">
                          Until {new Date(vehicle.booking_end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              📍 Vehicle locations shown are based on the pickup location set during listing.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
