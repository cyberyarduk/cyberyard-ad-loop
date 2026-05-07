import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, Sparkles, Smartphone, Tv, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import {
  getQuestionsForRole,
  getVersionForRole,
  RESEARCH_BUSINESS_TYPES,
  type RespondentRole,
  type Question,
} from "@/lib/survey";

type Step =
  | { kind: "intro"; index: number }
  | { kind: "role" }
  | { kind: "profile" }
  | { kind: "question"; q: Question; index: number; total: number }
  | { kind: "thanks" };

const INTRO_SLIDES = [
  {
    icon: Sparkles,
    title: "Hi, we're Cyberyard 👋",
    body: "We help businesses promote what they sell using any screen they already have — a TV, tablet, phone or laptop. No new hardware, no technical setup.",
  },
  {
    icon: Tv,
    title: "What we do",
    body: "Cyberyard turns any screen in your shop into a smart promotional display. Snap a photo of a product, upload an image — or create an advert from scratch in seconds — and instantly show it to your customers.",
  },
  {
    icon: Smartphone,
    title: "Controlled from anywhere",
    body: "Update what's showing in seconds — from your phone, tablet or laptop, wherever you are. Manage one shop or hundreds remotely. Even create video adverts in one tap.",
  },
  {
    icon: MessageSquare,
    title: "Why we're asking",
    body: "We're talking to real business owners and managers to make sure we build something genuinely useful — and priced fairly. It takes about 2 minutes. Thank you!",
  },
];

const PublicSurvey = () => {
  const [role, setRole] = useState<RespondentRole>("owner");
  const [introIdx, setIntroIdx] = useState(0);
  const [stage, setStage] = useState<"intro" | "role" | "profile" | "questions" | "thanks">("intro");
  const [qIdx, setQIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState({
    business_name: "",
    contact_name: "",
    business_type: "",
    address: "",
    city: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const activeQuestions = useMemo(() => getQuestionsForRole(role), [role]);
  const visibleQuestions = useMemo(
    () => activeQuestions.filter((q) => !q.showIf || q.showIf(answers)),
    [activeQuestions, answers],
  );

  const totalSteps = INTRO_SLIDES.length + 2 + visibleQuestions.length; // intros + role + profile + Qs
  const currentStep = (() => {
    if (stage === "intro") return introIdx + 1;
    if (stage === "role") return INTRO_SLIDES.length + 1;
    if (stage === "profile") return INTRO_SLIDES.length + 2;
    if (stage === "questions") return INTRO_SLIDES.length + 2 + qIdx + 1;
    return totalSteps;
  })();

  const setAnswer = (id: string, v: string | string[]) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: v };
      for (const q of activeQuestions) {
        if (q.showIf && !q.showIf(next) && next[q.id] !== undefined) {
          delete next[q.id];
        }
      }
      return next;
    });
  };

  const toggleMulti = (qid: string, value: string) => {
    const current = (answers[qid] as string[]) || [];
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    setAnswer(qid, next);
  };

  const goNext = () => {
    if (stage === "intro") {
      if (introIdx < INTRO_SLIDES.length - 1) setIntroIdx(introIdx + 1);
      else setStage("role");
    } else if (stage === "role") {
      setStage("profile");
    } else if (stage === "profile") {
      setStage("questions");
      setQIdx(0);
    } else if (stage === "questions") {
      if (qIdx < visibleQuestions.length - 1) setQIdx(qIdx + 1);
      else submit();
    }
  };

  const goBack = () => {
    if (stage === "intro") {
      if (introIdx > 0) setIntroIdx(introIdx - 1);
    } else if (stage === "role") {
      setStage("intro");
      setIntroIdx(INTRO_SLIDES.length - 1);
    } else if (stage === "profile") {
      setStage("role");
    } else if (stage === "questions") {
      if (qIdx > 0) setQIdx(qIdx - 1);
      else setStage("profile");
    }
  };

  const submit = async () => {
    if (!profile.business_name.trim()) {
      toast.error("Business name is required.");
      setStage("profile");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-public-survey", {
        body: {
          role,
          survey_version: getVersionForRole(role),
          profile,
          answers,
        },
      });
      if (error) throw error;
      setStage("thanks");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvance = (() => {
    if (stage === "profile") return profile.business_name.trim().length > 0;
    if (stage === "questions") {
      const q = visibleQuestions[qIdx];
      if (!q) return true;
      const a = answers[q.id];
      if (q.type === "text") return true; // optional
      if (q.type === "multi") return Array.isArray(a) && a.length > 0;
      return typeof a === "string" && a.length > 0;
    }
    return true;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      <header className="px-4 py-4 border-b border-border/50 bg-background/70 backdrop-blur">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="font-semibold tracking-tight">Cyberyard</div>
          <div className="text-xs text-muted-foreground">Quick survey · ~2 min</div>
        </div>
      </header>

      {stage !== "thanks" && (
        <div className="max-w-xl mx-auto w-full px-4 pt-4">
          <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
        </div>
      )}

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-6">
        <div className="w-full max-w-xl">
          {stage === "intro" && (() => {
            const slide = INTRO_SLIDES[introIdx];
            const Icon = slide.icon;
            return (
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-8 text-center space-y-5">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight">{slide.title}</h1>
                  <p className="text-muted-foreground leading-relaxed">{slide.body}</p>
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    {INTRO_SLIDES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${i === introIdx ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {stage === "role" && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-8 space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">First, who are you?</h2>
                  <p className="text-sm text-muted-foreground">So we can ask the right questions.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {([
                    { v: "owner" as const, label: "I'm the owner / decision-maker", sub: "Full survey (~2 min)" },
                    { v: "manager" as const, label: "I'm a manager or staff member", sub: "Shorter survey + owner contact" },
                  ]).map((r) => {
                    const active = role === r.v;
                    return (
                      <button
                        key={r.v}
                        type="button"
                        onClick={() => setRole(r.v)}
                        className={`relative rounded-xl border-2 p-4 text-left transition ${
                          active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {active && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="font-medium">{r.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{r.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {stage === "profile" && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-8 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">About your business</h2>
                  <p className="text-sm text-muted-foreground">Just the basics — only the business name is required.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Business name *</Label>
                  <Input
                    value={profile.business_name}
                    onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                    placeholder="e.g. The Coffee Stop"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input
                    value={profile.contact_name}
                    onChange={(e) => setProfile({ ...profile, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Business type</Label>
                  <Select
                    value={
                      RESEARCH_BUSINESS_TYPES.includes(profile.business_type as any)
                        ? profile.business_type
                        : profile.business_type
                          ? "Other"
                          : ""
                    }
                    onValueChange={(v) => setProfile({ ...profile, business_type: v === "Other" ? "Other:" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {RESEARCH_BUSINESS_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {(profile.business_type === "Other" || profile.business_type.startsWith("Other:")) && (
                    <Input
                      className="mt-2"
                      placeholder="Please specify"
                      value={profile.business_type.startsWith("Other:") ? profile.business_type.slice(6).trimStart() : ""}
                      onChange={(e) => setProfile({ ...profile, business_type: `Other: ${e.target.value}` })}
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>City / Town</Label>
                    <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone (optional)</Label>
                    <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="So we can follow up if you'd like a free trial"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {stage === "questions" && visibleQuestions[qIdx] && (() => {
            const q = visibleQuestions[qIdx];
            return (
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-8 space-y-5">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Question {qIdx + 1} of {visibleQuestions.length}
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight leading-snug">{q.label}</h2>
                    {q.type === "multi" && (
                      <p className="text-xs text-muted-foreground pt-1">Select all that apply.</p>
                    )}
                  </div>

                  {q.type === "single" && (
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((o) => {
                        const active = answers[q.id] === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setAnswer(q.id, o.value)}
                            className={`relative rounded-xl border-2 p-4 text-left transition ${
                              active ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                            }`}
                          >
                            {active && (
                              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "multi" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((o) => {
                        const selected = ((answers[q.id] as string[]) || []).includes(o.value);
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => toggleMulti(q.id, o.value)}
                            className={`relative rounded-xl border-2 p-4 text-left transition ${
                              selected ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                            }`}
                          >
                            {selected && (
                              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "text" && (
                    <Textarea
                      rows={q.multiline ? 4 : 2}
                      placeholder={q.placeholder}
                      value={(answers[q.id] as string) || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {stage === "thanks" && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-10 text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Check className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Thank you!</h1>
                <p className="text-muted-foreground">
                  Your answers have been sent. Genuinely, this helps us build something better for businesses like yours.
                </p>
                {answers["q10_trial_interest"] === "yes" && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    We'll be in touch about your free 2-week trial.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {stage !== "thanks" && (
            <div className="flex items-center justify-between gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={stage === "intro" && introIdx === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={goNext} disabled={!canAdvance || submitting} size="lg">
                {stage === "questions" && qIdx === visibleQuestions.length - 1
                  ? (submitting ? "Submitting…" : "Submit")
                  : stage === "intro" && introIdx < INTRO_SLIDES.length - 1
                    ? "Next"
                    : stage === "intro"
                      ? "Let's start"
                      : "Next"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-muted-foreground">
        Cyberyard · <a href="/privacy-policy" className="underline">Privacy</a>
      </footer>
    </div>
  );
};

export default PublicSurvey;
