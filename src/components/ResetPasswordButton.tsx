import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const ResetPasswordButton = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!profile?.email) {
      toast.error("No email on file for your account.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Password reset link sent to ${profile.email}`);
    } catch (err: any) {
      toast.error(err.message || "Couldn't send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-foreground transition-all disabled:opacity-60"
    >
      <KeyRound className="h-4 w-4 shrink-0" />
      <span>{loading ? "Sending…" : "Reset password"}</span>
    </button>
  );
};

export default ResetPasswordButton;
