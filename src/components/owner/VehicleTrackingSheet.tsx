import { useEffect, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Car, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

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

const mapContainerStyle = {
  width: "100%",
  height: "250px",
};

const defaultCenter = {
  lat: 17.385,
  lng: 78.4867,
};

export default function VehicleTrackingSheet({ isOpen, onClose }: VehicleTrackingSheetProps) {
  const { user } = useAuth();
  const [rentedVehicles, setRentedVehicles] = useState<RentedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<RentedVehicle | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchRentedVehicles();
    }
  }, [isOpen, user]);

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

      // Set map center to first vehicle with location
      const firstWithLocation = rentedVehiclesWithDetails.find(v => v.location_lat && v.location_lng);
      if (firstWithLocation) {
        setMapCenter({
          lat: firstWithLocation.location_lat!,
          lng: firstWithLocation.location_lng!,
        });
      }
    } catch (error) {
      console.error("Error fetching rented vehicles:", error);
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

  const focusOnVehicle = (vehicle: RentedVehicle) => {
    if (vehicle.location_lat && vehicle.location_lng) {
      const newCenter = { lat: vehicle.location_lat, lng: vehicle.location_lng };
      setMapCenter(newCenter);
      setSelectedVehicle(vehicle);
      if (map) {
        map.panTo(newCenter);
        map.setZoom(15);
      }
    }
  };

  const handleRefresh = () => {
    setSelectedVehicle(null);
    fetchRentedVehicles();
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const vehiclesWithLocation = rentedVehicles.filter(v => v.location_lat && v.location_lng);

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
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={12}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {vehiclesWithLocation.map((vehicle) => (
                    <Marker
                      key={vehicle.id}
                      position={{ lat: vehicle.location_lat!, lng: vehicle.location_lng! }}
                      onClick={() => setSelectedVehicle(vehicle)}
                      label={{
                        text: getVehicleEmoji(vehicle.vehicle_type),
                        fontSize: "20px",
                      }}
                    />
                  ))}

                  {selectedVehicle && selectedVehicle.location_lat && selectedVehicle.location_lng && (
                    <InfoWindow
                      position={{ lat: selectedVehicle.location_lat, lng: selectedVehicle.location_lng }}
                      onCloseClick={() => setSelectedVehicle(null)}
                    >
                      <div className="p-1">
                        <p className="font-semibold text-sm">
                          {selectedVehicle.brand} {selectedVehicle.model}
                        </p>
                        <p className="text-xs text-gray-600">{selectedVehicle.registration_number}</p>
                        <p className="text-xs mt-1">Rented by: {selectedVehicle.renter_name}</p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="h-64 flex items-center justify-center bg-muted">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
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
