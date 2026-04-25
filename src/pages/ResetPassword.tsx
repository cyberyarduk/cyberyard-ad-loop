import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event Supabase fires when a recovery link is opened
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setCanReset(true);
        setChecking(false);
      }
    });

    // Also handle the ?code= parameter (PKCE flow used in some recovery links)
    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error("Reset link is invalid or has expired. Request a new one.");
          setChecking(false);
          return;
        }
        setCanReset(true);
        setChecking(false);
        return;
      }

      // Fallback: if there's already a session (hash tokens auto-processed), allow reset
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCanReset(true);
      }
      setChecking(false);
    };

    init();

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Password updated. Please sign in again.");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>

        <Card className="w-full">
          <CardHeader className="text-center">
            <img src={logo} alt="Cyberyard" className="h-32 md:h-40 mx-auto mb-4" />
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Choose a new password for your Cyberyard account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {checking && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>Verifying reset link...</AlertDescription>
              </Alert>
            )}

            {!checking && !canReset && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This reset link is invalid or has expired. Please request a new one from the sign-in page.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={!canReset || loading}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={!canReset || loading}
              />
              <Button type="submit" className="w-full" disabled={!canReset || loading}>
                {loading ? "Updating password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
