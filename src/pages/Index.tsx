import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import UserHome from "@/components/user/UserHome";
import OwnerDashboard from "@/components/owner/OwnerDashboard";

const Index = () => {
  const { user, role, viewMode, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Show loading while auth is being determined OR while role is being fetched for logged-in user
  if (loading || (user && role === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Owners can view as customer if they selected "Customer" at login (viewMode === "user").
  // If user's actual role is "owner" but viewMode is "user", show UserHome (UI only).
  // Permissions are still enforced by the actual database role.
  if (role === "owner") {
    if (viewMode === "user") return <UserHome />;
    return <OwnerDashboard />;
  }

  return <UserHome />;
};

export default Index;
