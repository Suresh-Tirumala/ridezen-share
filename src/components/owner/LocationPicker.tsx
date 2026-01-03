import { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Search, Loader2 } from "lucide-react";

interface LocationPickerProps {
  address: string;
  lat: number | null;
  lng: number | null;
  onLocationChange: (address: string, lat: number | null, lng: number | null) => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "200px",
};

const defaultCenter = { lat: 16.5449, lng: 81.5212 }; // Amalapuram, India

export default function LocationPicker({ address, lat, lng, onLocationChange }: LocationPickerProps) {
  const [searchAddress, setSearchAddress] = useState(address);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    lat && lng ? { lat, lng } : defaultCenter
  );
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  );
  const [isSearching, setIsSearching] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    setSearchAddress(address);
    if (lat && lng) {
      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
    }
  }, [address, lat, lng]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPosition({ lat: newLat, lng: newLng });
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const newAddress = results[0].formatted_address;
          setSearchAddress(newAddress);
          onLocationChange(newAddress, newLat, newLng);
        } else {
          onLocationChange(searchAddress, newLat, newLng);
        }
      });
    }
  }, [onLocationChange, searchAddress]);

  const handleSearch = useCallback(() => {
    if (!searchAddress.trim() || !isLoaded) return;

    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchAddress }, (results, status) => {
      setIsSearching(false);
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        const newLat = location.lat();
        const newLng = location.lng();
        const formattedAddress = results[0].formatted_address;
        
        setMapCenter({ lat: newLat, lng: newLng });
        setMarkerPosition({ lat: newLat, lng: newLng });
        setSearchAddress(formattedAddress);
        onLocationChange(formattedAddress, newLat, newLng);
      }
    });
  }, [searchAddress, isLoaded, onLocationChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setMapCenter({ lat: newLat, lng: newLng });
        setMarkerPosition({ lat: newLat, lng: newLng });

        // Reverse geocode
        if (isLoaded) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const newAddress = results[0].formatted_address;
              setSearchAddress(newAddress);
              onLocationChange(newAddress, newLat, newLng);
            } else {
              onLocationChange("Current Location", newLat, newLng);
            }
          });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  }, [isLoaded, onLocationChange]);

  return (
    <div className="space-y-3">
      <Label>Vehicle Location</Label>
      
      <div className="flex gap-2">
        <Input
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          placeholder="Enter address or click on map"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
        />
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleUseCurrentLocation}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {isLoaded ? (
        <div className="rounded-lg overflow-hidden border border-border">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable
                onDragEnd={(e) => {
                  if (e.latLng) {
                    const newLat = e.latLng.lat();
                    const newLng = e.latLng.lng();
                    setMarkerPosition({ lat: newLat, lng: newLng });
                    
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                      if (status === "OK" && results && results[0]) {
                        const newAddress = results[0].formatted_address;
                        setSearchAddress(newAddress);
                        onLocationChange(newAddress, newLat, newLng);
                      } else {
                        onLocationChange(searchAddress, newLat, newLng);
                      }
                    });
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>
      ) : (
        <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {markerPosition && (
        <p className="text-xs text-muted-foreground">
          Coordinates: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}