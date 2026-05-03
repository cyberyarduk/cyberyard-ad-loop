import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const DEMO_MODE_KEY = "cyberyard_demo_mode";

const DemoModeBanner = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [active, setActive] = useState(false);

  useEffect(() => {
    try {
      setActive(sessionStorage.getItem(DEMO_MODE_KEY) === "1");
    } catch { /* ignore */ }
  }, []);

  if (!active || !isSuperAdmin) return null;

  const exit = () => {
    try { sessionStorage.removeItem(DEMO_MODE_KEY); } catch { /* ignore */ }
    setActive(false);
    toast.success("Demo Mode exited.");
    navigate("/admin");
  };

  return (
    <div className="sticky top-0 z-40 -mx-4 lg:-mx-8 mb-6 px-4 lg:px-8 py-2.5 bg-foreground text-background flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium min-w-0">
        <Eye className="h-4 w-4 shrink-0 text-yellow-bright" />
        <span className="truncate">
          Demo Mode — you're viewing the customer dashboard as a trial company.
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="rounded-full h-8 px-3 shrink-0"
        onClick={exit}
      >
        <X className="h-3.5 w-3.5 mr-1" /> Exit demo
      </Button>
    </div>
  );
};

export default DemoModeBanner;
