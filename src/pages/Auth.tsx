import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ArrowLeft, LogIn } from "lucide-react";

const routeForRole = (role?: string | null) => {
  if (role === "super_admin") return "/admin";
  if (role === "salesperson") return "/sales";
  return "/dashboard";
};

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, must_change_password")
          .eq("id", session.user.id)
          .single();
        if (profile?.must_change_password) {
          navigate("/reset-password?first_login=1");
          return;
        }
        navigate(routeForRole(profile?.role));
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, must_change_password")
        .eq("id", data.user!.id)
        .single();

      const role = profile?.role;
      if (!role) {
        await supabase.auth.signOut();
        toast.error("Account not configured. Please contact support.");
        return;
      }

      // Block suspended salespeople
      if (role === "salesperson") {
        const { data: sp } = await supabase
          .from("salespeople")
          .select("active")
          .eq("user_id", data.user!.id)
          .maybeSingle();
        if (!sp?.active) {
          await supabase.auth.signOut();
          toast.error("Your account has been suspended. Please contact your administrator.");
          return;
        }
      }

      if (profile?.must_change_password) {
        toast.info("Please set a new password to continue.");
        navigate("/reset-password?first_login=1");
        return;
      }

      toast.success("Welcome back!");
      navigate(routeForRole(role));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent. Check your inbox.");
      setShowReset(false);
    } catch (error: any) {
      toast.error(error.message || "Unable to send password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-wash-warm opacity-70" />

      <div className="w-full max-w-md space-y-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Button>
        </Link>

        <div className="premium-card card-highlight rounded-3xl p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-3">
            <img src={logo} alt="Cyberyard" className="h-16 mx-auto" />
            <div className="chip bg-yellow-soft text-foreground/80">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your Cyberyard account.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center">
            <Button variant="link" className="px-0 text-xs" onClick={() => setShowReset((c) => !c)}>
              Forgotten password?
            </Button>
          </div>

          {showReset && (
            <form onSubmit={handleResetPassword} className="space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                Enter your email above and we'll send you a reset link.
              </p>
              <Button type="submit" variant="secondary" className="w-full" disabled={resetLoading}>
                {resetLoading ? "Sending..." : "Send Password Reset Link"}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Need access? Contact your Cyberyard rep.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
