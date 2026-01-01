import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Bike, Bus, MapPin, Search, Home, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const vehicleCategories = [
  { id: "car", label: "Cars", icon: Car, color: "text-primary" },
  { id: "bike", label: "Bikes", icon: Bike, color: "text-accent" },
  { id: "auto", label: "Autos", icon: Bus, color: "text-success" },
];

const tourismPackages = [
  { id: 1, title: "Hill Station Adventure", duration: "3 Days", price: 299.99, image: "🏔️" },
  { id: 2, title: "City Tour Express", duration: "1 Day", price: 49.99, image: "🏙️" },
  { id: 3, title: "Coastal Highway Trip", duration: "2 Days", price: 199.99, image: "🏖️" },
];

export default function UserHome() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-lg font-bold">{profile?.full_name || "Rider"}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6 animate-fade-in">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vehicles, locations..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-input bg-card focus:border-primary transition-colors"
          />
        </div>

        {/* Vehicle Categories */}
        <section>
          <h2 className="text-lg font-bold mb-3">Browse by Category</h2>
          <div className="grid grid-cols-3 gap-3">
            {vehicleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
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

        {/* Nearby Vehicles Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Nearby Vehicles</h2>
            <Button variant="ghost" size="sm">See All</Button>
          </div>
          <Card variant="glass" className="p-6 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Enable location to see nearby vehicles</p>
            <Button className="mt-4" size="sm">Enable Location</Button>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 px-4 py-2">
        <div className="flex items-center justify-around">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "nearby", icon: MapPin, label: "Nearby" },
            { id: "search", icon: Search, label: "Search" },
            { id: "chat", icon: MessageCircle, label: "Chat" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
