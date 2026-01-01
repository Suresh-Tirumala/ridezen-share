import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Car, MessageCircle, MapPin, X, User } from "lucide-react";
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
}

interface SearchTabProps {
  onChatWithOwner: (ownerId: string, vehicleId: string) => void;
  onViewOwner: (ownerId: string) => void;
}

export default function SearchTab({ onChatWithOwner, onViewOwner }: SearchTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("is_available", true)
        .eq("is_disabled", false)
        .or(
          `brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,vehicle_type.ilike.%${searchQuery}%,location_address.ilike.%${searchQuery}%`
        );

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Error searching vehicles:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setVehicles([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by brand, model, type or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-12 pr-20 h-12"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          Search
        </Button>
      </div>

      {/* Search Suggestions */}
      {!hasSearched && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Popular Searches</h3>
          <div className="flex flex-wrap gap-2">
            {["Cars", "Bikes", "Autos", "SUV", "Sedan", "Scooter"].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  handleSearch();
                }}
                className="px-4 py-2 rounded-full bg-muted text-sm hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {vehicles.length} {vehicles.length === 1 ? "result" : "results"} found
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vehicles.length === 0 ? (
            <Card variant="glass" className="p-6 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No vehicles found for "{searchQuery}"</p>
              <Button variant="link" onClick={clearSearch} className="mt-2">
                Clear search
              </Button>
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
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vehicle.location_address}
                        </p>
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
        </div>
      )}
    </div>
  );
}
