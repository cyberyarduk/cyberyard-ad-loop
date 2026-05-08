import { Tv, LogIn } from "lucide-react";
import logo from "@/assets/logo.png";

interface PlayerLauncherProps {
  onChoose: (mode: "player" | "portal") => void;
}

const PlayerLauncher = ({ onChoose }: PlayerLauncherProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-wash-warm opacity-70" />
      <div className="w-full max-w-md">
        <div className="premium-card card-highlight rounded-3xl p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-3">
            <img src={logo} alt="Cyberyard" className="h-16 mx-auto" />
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Cyberyard</h1>
            <p className="text-sm text-muted-foreground">
              How would you like to use this device?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onChoose("player")}
              className="group w-full rounded-2xl border border-border/60 bg-background hover:bg-yellow-soft hover:border-foreground/20 transition-all p-5 flex items-center gap-4 text-left"
            >
              <div className="h-12 w-12 rounded-xl bg-lavender flex items-center justify-center shrink-0">
                <Tv className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Use as media player</p>
                <p className="text-xs text-muted-foreground">Pair this screen and start playing your content</p>
              </div>
            </button>

            <button
              onClick={() => onChoose("portal")}
              className="group w-full rounded-2xl border border-border/60 bg-background hover:bg-mint hover:border-foreground/20 transition-all p-5 flex items-center gap-4 text-left"
            >
              <div className="h-12 w-12 rounded-xl bg-yellow-soft flex items-center justify-center shrink-0">
                <LogIn className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Sign in to portal</p>
                <p className="text-xs text-muted-foreground">Customer, salesperson or admin login</p>
              </div>
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can switch modes any time by reopening the app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerLauncher;
