import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Phone, Mail, Car, MessageCircle, Star, MapPin, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  price_per_day: number;
  images: string[] | null;
  location_address: string | null;
  is_available: boolean | null;
}

interface OwnerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface OwnerProfileSheetProps {
  ownerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onChatWithOwner: (ownerId: string, vehicleId?: string) => void;
}

export default function OwnerProfileSheet({ 
  ownerId, 
  isOpen, 
  onClose, 
  onChatWithOwner 
}: OwnerProfileSheetProps) {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ownerId && isOpen) {
      fetchOwnerData();
    }
  }, [ownerId, isOpen]);

  const fetchOwnerData = async () => {
    if (!ownerId) return;
    setLoading(true);

    try {
      // Fetch owner profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", ownerId)
        .single();

      if (profileError) throw profileError;
      setOwner(profileData);

      // Fetch owner's available vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("is_available", true)
        .eq("is_disabled", false);

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Owner Profile</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : owner ? (
          <div className="space-y-6 overflow-y-auto pb-6">
            {/* Owner Info */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {owner.avatar_url ? (
                    <img src={owner.avatar_url} alt={owner.full_name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{owner.full_name || "Vehicle Owner"}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>4.8</span>
                    <span>•</span>
                    <span>{vehicles.length} vehicles</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2">
                {owner.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{owner.email}</span>
                  </div>
                )}
                {owner.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{owner.phone}</span>
                  </div>
                )}
              </div>

              {/* Chat Button */}
              <Button 
                className="w-full mt-4 gap-2" 
                onClick={() => {
                  onChatWithOwner(ownerId!, vehicles[0]?.id);
                  onClose();
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Chat with Owner
              </Button>
            </Card>

            {/* Owner's Vehicles */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Car className="h-5 w-5" />
                Available Vehicles ({vehicles.length})
              </h4>
              
              {vehicles.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  No vehicles available at the moment
                </Card>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="p-3 hover:shadow-md transition-shadow">
                      <div className="flex gap-3">
                        <div className="w-20 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {vehicle.images?.[0] ? (
                            <img 
                              src={vehicle.images[0]} 
                              alt={`${vehicle.brand} ${vehicle.model}`} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-2xl">{getVehicleEmoji(vehicle.vehicle_type)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{vehicle.brand} {vehicle.model}</p>
                          {vehicle.location_address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {vehicle.location_address}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-primary flex items-center mt-1">
                            <IndianRupee className="h-3 w-3" />
                            {vehicle.price_per_day}/day
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-shrink-0"
                          onClick={() => {
                            onChatWithOwner(ownerId!, vehicle.id);
                            onClose();
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Owner not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
