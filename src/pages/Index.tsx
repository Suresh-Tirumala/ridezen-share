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

  if (loading) {
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

  // Only show OwnerDashboard if user actually has owner role in database
  // This prevents RLS errors when users try to perform owner actions
  if (role === "owner") {
    return <OwnerDashboard />;
  }

  return <UserHome />;
};

export default Index;
