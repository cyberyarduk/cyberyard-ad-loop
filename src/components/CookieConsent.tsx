import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cyberyard_cookie_consent_v1";

type Choice = "accepted" | "essential" | null;

const CookieConsent = () => {
  const [choice, setChoice] = useState<Choice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Choice;
      setChoice(saved);
    } catch {
      // localStorage might be unavailable (private mode etc.)
    }
    setMounted(true);
  }, []);

  const save = (value: Exclude<Choice, null>) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch { /* ignore */ }
    setChoice(value);
  };

  if (!mounted || choice) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 right-3 md:left-6 md:right-6 z-[100] mx-auto max-w-3xl"
    >
      <div className="premium-card rounded-2xl p-5 md:p-6 shadow-2xl border bg-background">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-yellow-soft items-center justify-center shrink-0">
            <Cookie className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm mb-1">We value your privacy</p>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              We use essential cookies to make Cyberyard work, and optional analytics cookies
              to help us improve it. You can accept all, or choose essential only. See our{" "}
              <Link to="/cookies-policy" className="underline hover:text-foreground">Cookies Policy</Link>
              {" "}and{" "}
              <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button size="sm" onClick={() => save("accepted")} className="rounded-full">
                Accept all
              </Button>
              <Button size="sm" variant="outline" onClick={() => save("essential")} className="rounded-full">
                Essential only
              </Button>
              <Link to="/cookies-policy" className="sm:ml-auto">
                <Button size="sm" variant="ghost" className="rounded-full">
                  Manage preferences
                </Button>
              </Link>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss (essential only)"
            onClick={() => save("essential")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
