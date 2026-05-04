import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cyberyard_cookie_consent_v2";

type Preferences = {
  essential: true;
  functional: boolean;
  analytics: boolean;
  decidedAt: string;
};

const DEFAULTS: Omit<Preferences, "decidedAt"> = {
  essential: true,
  functional: false,
  analytics: false,
};

const readPrefs = (): Preferences | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "decidedAt" in parsed) {
      return parsed as Preferences;
    }
    return null;
  } catch {
    return null;
  }
};

const writePrefs = (prefs: Preferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    // Clean up legacy key
    localStorage.removeItem("cyberyard_cookie_consent_v1");
  } catch {
    /* ignore */
  }
};

// Allow reopening from anywhere (e.g. Cookies Policy page)
declare global {
  interface Window {
    openCookiePreferences?: () => void;
  }
}

const CookieConsent = () => {
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Preferences, "decidedAt">>(DEFAULTS);

  useEffect(() => {
    const existing = readPrefs();
    setPrefs(existing);
    setBannerOpen(!existing);
    if (existing) {
      setDraft({
        essential: true,
        functional: existing.functional,
        analytics: existing.analytics,
      });
    }
    setMounted(true);

    window.openCookiePreferences = () => {
      const current = readPrefs();
      setDraft({
        essential: true,
        functional: current?.functional ?? false,
        analytics: current?.analytics ?? false,
      });
      setDialogOpen(true);
    };
    return () => {
      delete window.openCookiePreferences;
    };
  }, []);

  const persist = (next: Omit<Preferences, "decidedAt">) => {
    const full: Preferences = { ...next, essential: true, decidedAt: new Date().toISOString() };
    writePrefs(full);
    setPrefs(full);
    setBannerOpen(false);
  };

  const acceptAll = () => persist({ essential: true, functional: true, analytics: true });
  const essentialOnly = () => persist({ essential: true, functional: false, analytics: false });
  const saveDraft = () => {
    persist(draft);
    setDialogOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      {bannerOpen && (
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
                  We use essential cookies to make Cyberyard work, and optional functional and
                  analytics cookies to help us improve it. See our{" "}
                  <Link to="/cookies-policy" className="underline hover:text-foreground">Cookies Policy</Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button size="sm" onClick={acceptAll} className="rounded-full">
                    Accept all
                  </Button>
                  <Button size="sm" variant="outline" onClick={essentialOnly} className="rounded-full">
                    Essential only
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDialogOpen(true)}
                    className="rounded-full sm:ml-auto"
                  >
                    Manage preferences
                  </Button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss (essential only)"
                onClick={essentialOnly}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies you're happy for us to use. You can change these at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Strictly necessary</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Required to sign you in, keep your session secure, and remember your cookie
                  choice. Always on.
                </p>
              </div>
              <Switch checked disabled aria-label="Strictly necessary (always on)" />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Functional</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Remember preferences such as your selected dashboard view.
                </p>
              </div>
              <Switch
                checked={draft.functional}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, functional: v }))}
                aria-label="Functional cookies"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Analytics</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Help us understand how the platform is used so we can improve it.
                </p>
              </div>
              <Switch
                checked={draft.analytics}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
                aria-label="Analytics cookies"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={essentialOnly} className="rounded-full">
              Essential only
            </Button>
            <Button variant="outline" onClick={acceptAll} className="rounded-full">
              Accept all
            </Button>
            <Button onClick={saveDraft} className="rounded-full">
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
