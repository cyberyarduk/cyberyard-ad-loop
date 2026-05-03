import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_MESSAGE = "EMERGENCY — Please follow staff instructions";

const EmergencyAlertButton = () => {
  const [active, setActive] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      if (!profile?.company_id) return;
      setCompanyId(profile.company_id);
      const { data: company } = await supabase
        .from("companies")
        .select("emergency_active")
        .eq("id", profile.company_id)
        .single();
      setActive(!!company?.emergency_active);
    })();
  }, []);

  const trigger = async () => {
    if (!companyId) return;
    setBusy(true);
    const { error } = await supabase
      .from("companies")
      .update({
        emergency_active: true,
        emergency_message: DEFAULT_MESSAGE,
        emergency_started_at: new Date().toISOString(),
      } as any)
      .eq("id", companyId);
    setBusy(false);
    setConfirmOpen(false);
    if (error) {
      toast.error("Failed to send alert");
      return;
    }
    setActive(true);
    toast.success("Emergency alert sent to all screens");
  };

  const clear = async () => {
    if (!companyId) return;
    setBusy(true);
    const { error } = await supabase
      .from("companies")
      .update({ emergency_active: false } as any)
      .eq("id", companyId);
    setBusy(false);
    if (error) {
      toast.error("Failed to clear alert");
      return;
    }
    setActive(false);
    toast.success("Alert cleared — screens returning to normal");
  };

  if (active) {
    return (
      <Button variant="destructive" onClick={clear} disabled={busy}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Clear emergency alert
      </Button>
    );
  }

  return (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Emergency alert
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send emergency alert to all screens?</AlertDialogTitle>
          <AlertDialogDescription>
            Every screen on your account will immediately switch to a flashing red emergency screen
            until you clear it. Use this only for genuine emergencies.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={trigger} disabled={busy}>
            {busy ? "Sending…" : "Send to all screens"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmergencyAlertButton;
