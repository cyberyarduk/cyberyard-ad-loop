import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Card removed — using premium-card div
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ArrowLeft, Building2, BriefcaseBusiness, ShieldCheck } from "lucide-react";

type Portal = "customer" | "salesperson" | "admin";

const portalCopy: Record<Portal, { title: string; subtitle: string; icon: any; chip: string }> = {
  customer: {
    title: "Customer Portal",
    subtitle: "Manage your devices, content & playlists.",
    icon: Building2,
    chip: "bg-yellow-soft",
  },
  salesperson: {
    title: "Salesperson Portal",
    subtitle: "Track your signups, hit your monthly target.",
    icon: BriefcaseBusiness,
    chip: "bg-lavender",
  },
  admin: {
    title: "Admin Portal",
    subtitle: "Oversee the entire Cyberyard CRM.",
    icon: ShieldCheck,
    chip: "bg-mint",
  },
};

const Auth = () => {
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal>("customer");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Decide route based on profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile?.role === "super_admin") navigate("/admin");
        else if (profile?.role === "salesperson") navigate("/sales");
        else navigate("/dashboard");
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

      // Pull profile to validate they used the right portal
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, must_change_password")
        .eq("id", data.user!.id)
        .single();

      const role = profile?.role;
      const portalRoleMap: Record<Portal, string[]> = {
        customer: ["company_admin", "company_user"],
        salesperson: ["salesperson"],
        admin: ["super_admin"],
      };

      if (!role || !portalRoleMap[portal].includes(role)) {
        await supabase.auth.signOut();
        toast.error(`This account isn't authorised for the ${portalCopy[portal].title}.`);
        return;
      }

      // Block suspended salespeople at sign-in
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
      if (role === "super_admin") navigate("/admin");
      else if (role === "salesperson") navigate("/sales");
      else navigate("/dashboard");
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

  const PortalIcon = portalCopy[portal].icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft pastel wash matching homepage */}
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
            <div className={`chip ${portalCopy[portal].chip} text-foreground/80`}>
              <PortalIcon className="h-3.5 w-3.5" />
              {portalCopy[portal].title}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">{portalCopy[portal].subtitle}</p>
          </div>

            <Tabs value={portal} onValueChange={(v) => setPortal(v as Portal)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="customer" className="text-xs py-2">Customer</TabsTrigger>
                <TabsTrigger value="salesperson" className="text-xs py-2">Salesperson</TabsTrigger>
                <TabsTrigger value="admin" className="text-xs py-2">Admin</TabsTrigger>
              </TabsList>

              {(["customer", "salesperson", "admin"] as Portal[]).map((p) => (
                <TabsContent key={p} value={p} className="space-y-4 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`email-${p}`}>Email</Label>
                      <Input
                        id={`email-${p}`}
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`password-${p}`}>Password</Label>
                      <Input
                        id={`password-${p}`}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : `Sign in to ${portalCopy[p].title}`}
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
                    {p === "customer" && "Need access? Contact your Cyberyard rep."}
                    {p === "salesperson" && "Salesperson accounts are created by an admin."}
                    {p === "admin" && "Admin access is restricted to authorised personnel."}
                  </p>
                </TabsContent>
              ))}
            </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
