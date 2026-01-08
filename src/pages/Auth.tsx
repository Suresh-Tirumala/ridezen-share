import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, ArrowRight, Mail, Lock, UserCircle, Car } from "lucide-react";

import { z } from "zod";
import SplashScreen from "@/components/SplashScreen";
import rideRentLogo from "@/assets/RideRentLOGO-2.png";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "user"]),
});

type AppRole = "owner" | "user";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSplash, setShowSplash] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, selectedRole);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: `You have successfully logged in as ${selectedRole === "owner" ? "Owner" : "Customer"}.`,
            duration: 3000,
          });
          setShowSplash(true);
        }
      } else {
        const validation = signUpSchema.safeParse({
          fullName,
          email,
          password,
          role: selectedRole,
        });

        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please sign in.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome to RideRent! You're now logged in.",
            duration: 3000,
          });
          setShowSplash(true);
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-md animate-fade-in stagger-1">
        <Card variant="elevated" className="backdrop-blur-sm border-primary/10 shadow-glow">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <img src={rideRentLogo} alt="RideRent" className="h-32 w-auto object-contain" />
            </div>
            <CardDescription className="text-muted-foreground">
              {isLogin
                ? "Sign in to access your account"
                : "Join RideRent and start your journey"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection - shown for both login and signup */}
              <div className="space-y-2">
                <Label className="text-foreground/80">{isLogin ? "Sign in as" : "I want to"}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("user")}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                      selectedRole === "user"
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <User className={`h-6 w-6 transition-colors ${selectedRole === "user" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium transition-colors ${selectedRole === "user" ? "text-primary" : "text-muted-foreground"}`}>
                      {isLogin ? "Customer" : "Rent Vehicles"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("owner")}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                      selectedRole === "owner"
                        ? "border-accent bg-accent/10 shadow-accent"
                        : "border-border/50 hover:border-accent/50 hover:bg-accent/5"
                    }`}
                  >
                    <Car className={`h-6 w-6 transition-colors ${selectedRole === "owner" ? "text-accent" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium transition-colors ${selectedRole === "owner" ? "text-accent" : "text-muted-foreground"}`}>
                      {isLogin ? "Owner" : "List My Vehicles"}
                    </span>
                  </button>
                </div>
              </div>

              {!isLogin && (
                <>
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground/80">Full Name</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-muted/30 border-border/50 focus:border-primary"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-primary"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-primary"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full shadow-glow" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-primary font-semibold hover:underline transition-all"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
