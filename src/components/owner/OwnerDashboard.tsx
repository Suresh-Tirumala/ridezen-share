import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Plus, Settings, User, LogOut, Eye, EyeOff, Trash2, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VehicleImageUpload from "./VehicleImageUpload";
import OwnerProfileSheet from "./OwnerProfileSheet";
import ChatScreen from "@/components/chat/ChatScreen";

export default function OwnerDashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  
  // Chat state
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Form state
  const [vehicleType, setVehicleType] = useState<string>("");
  const [regNumber, setRegNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["owner-vehicles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["owner-unread-messages", user?.id],
    queryFn: async () => {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("owner_id", user?.id);

      if (!conversations || conversations.length === 0) return 0;

      const convoIds = conversations.map(c => c.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .neq("sender_id", user?.id)
        .eq("is_read", false);

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const addVehicleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicles").insert({
        owner_id: user?.id,
        vehicle_type: vehicleType as "car" | "bike" | "auto" | "bus",
        registration_number: regNumber,
        brand,
        model,
        price_per_day: parseFloat(pricePerDay),
        location_address: locationAddress || null,
        images: vehicleImages,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      setAddVehicleOpen(false);
      setVehicleType("");
      setRegNumber("");
      setBrand("");
      setModel("");
      setPricePerDay("");
      setLocationAddress("");
      setVehicleImages([]);
      toast({ title: "Vehicle added successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleVehicle = async (id: string, isDisabled: boolean) => {
    await supabase.from("vehicles").update({ is_disabled: !isDisabled }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
  };

  const deleteVehicle = async (id: string) => {
    await supabase.from("vehicles").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
    toast({ title: "Vehicle removed" });
  };

  const handleOpenChat = (conversationId: string) => {
    setChatConversationId(conversationId);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-accent rounded-xl flex items-center justify-center">
              <Car className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold">Owner Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setProfileSheetOpen(true)}
            >
              <User className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6 animate-fade-in">
        {/* Add Vehicle Button */}
        <Dialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" className="w-full" size="lg">
              <Plus className="h-5 w-5 mr-2" /> Add New Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addVehicleMutation.mutate(); }} className="space-y-4 mt-4">
              <div>
                <Label>Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="bike">🏍️ Bike</SelectItem>
                    <SelectItem value="auto">🛺 Auto</SelectItem>
                    <SelectItem value="bus">🚌 Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="ABC-1234" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Brand</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" /></div>
                <div><Label>Model</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camry" /></div>
              </div>
              <div>
                <Label>Price per Day (₹)</Label>
                <Input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} placeholder="500" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="City, Area" />
              </div>
              <div>
                <Label>Vehicle Images</Label>
                <VehicleImageUpload 
                  images={vehicleImages} 
                  onImagesChange={setVehicleImages}
                  maxImages={5}
                />
              </div>
              <Button type="submit" className="w-full" disabled={addVehicleMutation.isPending}>
                {addVehicleMutation.isPending ? "Adding..." : "Add Vehicle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Vehicles List */}
        <section>
          <h2 className="text-lg font-bold mb-3">Your Vehicles</h2>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : vehicles.length === 0 ? (
            <Card variant="glass" className="p-8 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No vehicles yet. Add your first vehicle!</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} variant="interactive" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {vehicle.vehicle_type === "car" ? "🚗" : vehicle.vehicle_type === "bike" ? "🏍️" : vehicle.vehicle_type === "auto" ? "🛺" : "🚌"}
                      </div>
                      <div>
                        <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.registration_number}</p>
                        <p className="text-sm font-semibold text-primary">${vehicle.price_per_day}/day</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.is_disabled ? "bg-destructive/10 text-destructive" : vehicle.is_available ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {vehicle.is_disabled ? "Disabled" : vehicle.is_available ? "Available" : "Booked"}
                      </span>
                      <Button variant="ghost" size="iconSm" onClick={() => toggleVehicle(vehicle.id, vehicle.is_disabled || false)}>
                        {vehicle.is_disabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="iconSm" onClick={() => deleteVehicle(vehicle.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Owner Profile Sheet */}
      <OwnerProfileSheet
        isOpen={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
        vehicles={vehicles}
        onOpenChat={handleOpenChat}
      />

      {/* Chat Screen */}
      <ChatScreen
        conversationId={chatConversationId}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}
