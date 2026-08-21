import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  Tv,
  Tablet,
  Smartphone,
  Laptop,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Copy,
  X,
} from "lucide-react";

type ScreenKind = "tv" | "tablet" | "phone" | "laptop";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
}

const SCREEN_OPTIONS: {
  kind: ScreenKind;
  icon: typeof Tv;
  label: string;
  hint: string;
  tone: string;
}[] = [
  { kind: "tv", icon: Tv, label: "A TV", hint: "Smart TV, Android TV box or Fire Stick", tone: "bg-lavender" },
  { kind: "tablet", icon: Tablet, label: "A tablet", hint: "iPad or Android tablet", tone: "bg-mint" },
  { kind: "phone", icon: Smartphone, label: "A phone", hint: "A spare iPhone or Android phone", tone: "bg-peach" },
  { kind: "laptop", icon: Laptop, label: "A laptop or PC", hint: "Any spare computer with a browser", tone: "bg-yellow-soft" },
];

const detectCurrentDevice = (): ScreenKind => {
  const ua = navigator.userAgent || "";
  const isTablet = /iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isPhone = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  if (isTablet) return "tablet";
  if (isPhone) return "phone";
  return "laptop";
};

const INSTRUCTIONS: Record<ScreenKind, { title: string; steps: string[] }> = {
  tv: {
    title: "Get Cyberyard onto your TV",
    steps: [
      "On the TV, open its app store and install the Cyberyard app (Android TV / Fire TV), or open the TV's web browser.",
      "Go to cyberyard.co.uk/player on the TV — it opens straight into media player mode.",
      "Leave that screen open on the TV. It will ask for a pairing code.",
      "Keep this window open here — we'll give you the code in the next step.",
    ],
  },
  tablet: {
    title: "Get Cyberyard onto your tablet",
    steps: [
      "On the tablet, install the Cyberyard app from the App Store or Google Play (or open cyberyard.co.uk/player in its browser).",
      "Open the app on the tablet and choose 'Use as media player'.",
      "Leave the tablet on that screen — it will ask for a pairing code.",
      "Keep this window open here — we'll give you the code in the next step.",
    ],
  },
  phone: {
    title: "Get Cyberyard onto your phone",
    steps: [
      "On the phone you want to use as the screen, install the Cyberyard app (App Store or Google Play).",
      "Open the app on that phone and choose 'Use as media player'.",
      "Leave the phone on that screen — it will ask for a pairing code.",
      "Keep this window open here — we'll give you the code in the next step.",
    ],
  },
  laptop: {
    title: "Get Cyberyard onto your laptop or PC",
    steps: [
      "On the laptop/PC that will be the screen, open a browser and go to cyberyard.co.uk/player.",
      "It opens straight into media player mode and asks for a pairing code.",
      "Press F11 for full screen so nothing else is visible.",
      "Keep this window open here — we'll give you the code in the next step.",
    ],
  },
};

const OnboardingWizard = ({ open, onOpenChange, onFinish }: Props) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<ScreenKind | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [qr, setQr] = useState("");
  const [paired, setPaired] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const pollRef = useRef<number | null>(null);

  const currentDevice = useMemo(detectCurrentDevice, []);
  const sameDeviceWarning = kind !== null && kind === currentDevice;

  // Generate the pairing QR once we have a device
  useEffect(() => {
    if (!device?.pairing_qr_token) return;
    QRCode.toDataURL(device.pairing_qr_token).then(setQr).catch(() => setQr(""));
  }, [device]);

  // Watch for the screen pairing itself
  useEffect(() => {
    if (!device?.id || paired || step !== 3) return;

    const check = async () => {
      const { data } = await supabase
        .from("devices")
        .select("id, auth_token, last_seen_at")
        .eq("id", device.id)
        .maybeSingle();
      if (data?.auth_token) {
        setPaired(true);
      }
    };

    check();
    const channel = supabase
      .channel(`onboarding-device-${device.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "devices", filter: `id=eq.${device.id}` },
        () => check()
      )
      .subscribe();
    pollRef.current = window.setInterval(check, 4000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [device, paired, step]);

  if (!open) return null;

  const close = () => {
    onOpenChange(false);
    onFinish?.();
  };

  const createDevice = async () => {
    if (!deviceName.trim()) return toast.error("Give your screen a name first");
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("devices")
        .insert({
          name: deviceName.trim(),
          user_id: user.id,
          company_id: profile?.company_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      setDevice(data);
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the screen");
    } finally {
      setCreating(false);
    }
  };

  // Auto-create the first playlist, attach it to the device, then head to the AI creator
  const startFirstVideo = async () => {
    setPreparing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const { data: existing } = await supabase
        .from("playlists")
        .select("id")
        .limit(1);

      let playlistId = existing?.[0]?.id as string | undefined;

      if (!playlistId) {
        const { data: created, error } = await supabase
          .from("playlists")
          .insert({
            name: "My first playlist",
            user_id: user.id,
            company_id: profile?.company_id ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        playlistId = created.id;
      }

      if (device?.id && playlistId) {
        await supabase.from("devices").update({ playlist_id: playlistId }).eq("id", device.id);
      }

      onFinish?.();
      onOpenChange(false);
      navigate(`/videos/create-ai?playlistId=${playlistId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set up your playlist");
    } finally {
      setPreparing(false);
    }
  };

  const totalSteps = 5;

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-wash-warm opacity-70" />
      <button
        onClick={close}
        aria-label="Close setup"
        className="fixed right-4 z-10 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="mx-auto w-full max-w-xl px-5 pb-16"
        style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-7 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
        {children}
      </div>
    </div>
  );

  // Step 0 — welcome
  if (step === 0) {
    return (
      <Shell>
        <div className="p-3 bg-yellow-bright/60 rounded-xl w-fit mb-5">
          <Sparkles className="h-6 w-6 text-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Cyberyard</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Let's get your first screen live. It takes about five minutes and we'll walk you through every step.
        </p>
        <ul className="space-y-3 mt-7">
          {[
            "Choose the screen you want to advertise on",
            "Connect it to your account",
            "Create your first advert with AI",
            "Watch it start playing",
          ].map((t) => (
            <li key={t} className="flex gap-3 text-sm">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-foreground/80">{t}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-9">
          <Button variant="ghost" onClick={close} className="text-muted-foreground">
            I'll do this later
          </Button>
          <Button className="ml-auto" onClick={() => setStep(1)}>
            Let's go <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Shell>
    );
  }

  // Step 1 — pick the screen type
  if (step === 1) {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">What screen will you use?</h1>
        <p className="text-muted-foreground mt-3">
          This is the screen your customers will see — it can be anything you already own.
        </p>
        <div className="space-y-3 mt-7">
          {SCREEN_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isCurrent = opt.kind === currentDevice;
            return (
              <button
                key={opt.kind}
                onClick={() => {
                  setKind(opt.kind);
                  setStep(2);
                }}
                className="w-full rounded-2xl border border-border/60 bg-background hover:border-foreground/20 hover:bg-secondary/50 transition-all p-4 flex items-center gap-4 text-left"
              >
                <div className={`h-12 w-12 rounded-xl ${opt.tone} flex items-center justify-center shrink-0`}>
                  <Icon className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {opt.label}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (looks like what you're on now)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-8">
          <Button variant="outline" onClick={() => setStep(0)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </Shell>
    );
  }

  // Step 2 — install / open the player on that screen, then name it
  if (step === 2 && kind) {
    const info = INSTRUCTIONS[kind];
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">{info.title}</h1>
        <div className="mt-5 rounded-2xl border border-border/60 bg-secondary/40 p-4">
          <p className="text-sm text-foreground/80">
            <strong>Important:</strong> Cyberyard needs to be open in two places — here, where you manage
            everything, <em>and</em> on the screen itself, which plays the adverts.
            {sameDeviceWarning && (
              <>
                {" "}
                You've picked the same kind of device you're using now — if you want to use{" "}
                <em>this very device</em> as the screen, finish this step first, then tap{" "}
                <strong>Player</strong> in the bottom bar.
              </>
            )}
          </p>
        </div>
        <ol className="space-y-3 mt-6">
          {info.steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm">
              <span className="h-5 w-5 shrink-0 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-foreground/80">{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-2">
          <Label htmlFor="onboarding-device-name">Give this screen a name</Label>
          <Input
            id="onboarding-device-name"
            placeholder="e.g. Front window TV"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            So you know which screen is which when you have a few of them.
          </p>
        </div>

        <div className="flex gap-2 mt-8">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button className="ml-auto" onClick={createDevice} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Get my pairing code
          </Button>
        </div>
      </Shell>
    );
  }

  // Step 3 — pairing code + live wait
  if (step === 3) {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">
          {paired ? "Your screen is connected" : "Enter this code on your screen"}
        </h1>
        <p className="text-muted-foreground mt-3">
          {paired
            ? `${device?.name} is paired and ready for content.`
            : "On the other device, the Cyberyard player is asking for a pairing code. Type this in."}
        </p>

        {!paired && (
          <>
            <div className="mt-7 rounded-2xl border border-border/60 bg-background p-6 text-center">
              <p className="text-4xl font-mono font-semibold tracking-[0.3em]">
                {device?.device_code || "------"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-muted-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(device?.device_code || "");
                  toast.success("Code copied");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy code
              </Button>
              {qr && (
                <div className="mt-5 border-t border-border/60 pt-5">
                  <p className="text-xs text-muted-foreground mb-3">
                    Or scan this with the phone/tablet you're pairing
                  </p>
                  <img src={qr} alt="Pairing QR code" className="mx-auto h-40 w-40" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for your screen to connect…
            </div>
          </>
        )}

        {paired && (
          <div className="mt-7 rounded-2xl border border-border/60 bg-mint/40 p-6 flex items-center gap-3">
            <Check className="h-5 w-5 text-foreground" />
            <p className="font-medium">Connected</p>
          </div>
        )}

        <div className="flex gap-2 mt-8">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => setStep(4)}>
            {paired ? "Continue" : "Skip for now"}
          </Button>
          {paired && (
            <Button className="ml-auto" onClick={() => setStep(4)}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Shell>
    );
  }

  // Step 4 — first video (playlist auto-created)
  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Now let's make your first advert</h1>
      <p className="text-muted-foreground mt-3">
        Describe an offer in a sentence and Cyberyard builds the video for you — usually in about a minute.
      </p>
      <ul className="space-y-3 mt-7">
        {[
          "We'll create a playlist called “My first playlist” for you",
          device?.name
            ? `It's already assigned to ${device.name}`
            : "Assign it to a screen once one is connected",
          "Your new video drops straight into it",
          "The screen picks it up automatically and loops it all day",
        ].map((t) => (
          <li key={t} className="flex gap-3 text-sm">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="text-foreground/80">{t}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-9">
        <Button variant="outline" onClick={() => setStep(3)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button className="ml-auto" onClick={startFirstVideo} disabled={preparing}>
          {preparing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Create my first advert
        </Button>
      </div>
      <div className="text-center mt-4">
        <Button variant="ghost" className="text-muted-foreground" onClick={close}>
          I'll do this later
        </Button>
      </div>
    </Shell>
  );
};

export default OnboardingWizard;
