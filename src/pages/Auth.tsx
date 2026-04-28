import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ArrowLeft, Building2, BriefcaseBusiness, ShieldCheck } from "lucide-react";

type Portal = "customer" | "salesperson" | "admin";

const portalCopy: Record<Portal, { title: string; subtitle: string; icon: any; gradient: string }> = {
  customer: {
    title: "Customer Portal",
    subtitle: "Manage your devices, content & playlists.",
    icon: Building2,
    gradient: "from-amber-200 via-yellow-100 to-orange-100",
  },
  salesperson: {
    title: "Salesperson Portal",
    subtitle: "Track your signups, hit your monthly target.",
    icon: BriefcaseBusiness,
    gradient: "from-violet-200 via-fuchsia-100 to-rose-100",
  },
  admin: {
    title: "Admin Portal",
    subtitle: "Oversee the entire Cyberyard CRM.",
    icon: ShieldCheck,
    gradient: "from-sky-200 via-cyan-100 to-emerald-100",
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
        .select("role")
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft pastel washes */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute top-0 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-amber-200 to-orange-100 blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-sky-200 to-violet-100 blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Button>
        </Link>

        <Card className="w-full border-border/60 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <img src={logo} alt="Cyberyard" className="h-20 mx-auto" />
              <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${portalCopy[portal].gradient} px-3 py-1 text-xs font-medium text-foreground/80`}>
                <PortalIcon className="h-3.5 w-3.5" />
                {portalCopy[portal].title}
              </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
