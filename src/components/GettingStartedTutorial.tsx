import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Monitor, List, Tv, Sparkles, ArrowLeft, ArrowRight, Check } from "lucide-react";

export interface TutorialStep {
  icon: typeof Video;
  tone: string;
  title: string;
  body: string;
  points: string[];
}

export const tutorialSteps: TutorialStep[] = [
  {
    icon: Sparkles,
    tone: "bg-yellow-bright/60",
    title: "Welcome to Cyberyard",
    body: "Cyberyard turns any screen you already own — a TV, tablet, phone or old laptop — into an in‑store advertising display. Here's how it works in four short steps.",
    points: [
      "Create an advert",
      "Add it to a playlist",
      "Pair a screen as a media player",
      "Push the playlist to your screens",
    ],
  },
  {
    icon: Video,
    tone: "bg-peach",
    title: "1. Create an advert",
    body: "Head to Create and describe your offer — Cyberyard writes and builds the video for you in about a minute.",
    points: [
      "Type your offer, e.g. “2 for 1 on all coffees before 11am”",
      "Pick a design style and an animated overlay",
      "Generate — you get both a wide and an upright version",
      "You can also upload your own images or videos in Media",
    ],
  },
  {
    icon: List,
    tone: "bg-mint",
    title: "2. Build a playlist",
    body: "A playlist is simply the running order of what plays in store. Screens loop the playlist all day.",
    points: [
      "Go to Playlists and create one, e.g. “Morning offers”",
      "Add your videos and images in the order you want",
      "Set how long each image stays on screen",
      "Reorder or remove items any time",
    ],
  },
  {
    icon: Monitor,
    tone: "bg-lavender",
    title: "3. Set up a media player",
    body: "Any spare screen can become a player. Install the Cyberyard app on the device, then pair it to your account.",
    points: [
      "On this app, tap Player in the bottom bar to open media player mode",
      "The screen shows a pairing code",
      "In Devices, tap Add device and enter that code",
      "Name the screen so you know where it is, e.g. “Front window”",
    ],
  },
  {
    icon: Tv,
    tone: "bg-secondary",
    title: "4. Push it live",
    body: "Assign the playlist to your screen and push it — the device updates within seconds and loops automatically.",
    points: [
      "Open Playlists and choose Push to device",
      "Pick the screens you want it on",
      "Screens keep playing even if the internet drops",
      "Update the playlist any time and push again",
    ],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
}

const GettingStartedTutorial = ({ open, onOpenChange, onFinish }: Props) => {
  const [step, setStep] = useState(0);
  const current = tutorialSteps[step];
  const Icon = current.icon;
  const isLast = step === tutorialSteps.length - 1;

  const close = () => {
    onOpenChange(false);
    onFinish?.();
    setTimeout(() => setStep(0), 200);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className={`p-3 ${current.tone} rounded-xl w-fit mb-2`}>
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <DialogTitle className="text-2xl tracking-tight">{current.title}</DialogTitle>
          <DialogDescription className="text-base text-foreground/70">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 mt-1">
          {current.points.map((point) => (
            <li key={point} className="flex gap-3 text-sm">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-foreground/80">{point}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-center gap-1.5 pt-2">
          {tutorialSteps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          <Button variant="ghost" onClick={close} className="text-muted-foreground">
            {isLast ? "Close" : "Skip"}
          </Button>
          {!isLast && (
            <Button className="ml-auto" onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {isLast && (
            <Button className="ml-auto" onClick={close}>
              Get started
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GettingStartedTutorial;
