import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SURVEY_QUESTIONS, SURVEY_VERSION, RESEARCH_BUSINESS_TYPES } from "@/lib/survey";

const NewResearchLead = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

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
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const visibleQuestions = useMemo(
    () => SURVEY_QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)),
    [answers]
  );

  const setAnswer = (id: string, v: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: v };
      // strip answers whose questions become hidden
      for (const q of SURVEY_QUESTIONS) {
        if (q.showIf && !q.showIf(next) && next[q.id] !== undefined) {
          delete next[q.id];
        }
      }
      return next;
    });
  };

  const submit = async () => {
    if (!profile.business_name.trim()) {
      toast.error("Business name is required.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const isTrialLead = answers["q9_trial"] === "yes";
      const { data: lead, error: leadErr } = await supabase
        .from("research_leads")
        .insert({
          business_name: profile.business_name.trim(),
          contact_name: profile.contact_name.trim() || null,
          business_type: profile.business_type || null,
          address: profile.address.trim() || null,
          city: profile.city.trim() || null,
          email: profile.email.trim() || null,
          phone: profile.phone.trim() || null,
          notes: profile.notes.trim() || null,
          status: isTrialLead ? "trial_offered" : "new_lead",
          is_trial_lead: isTrialLead,
          created_by_user_id: user.id,
        })
        .select()
        .single();
      if (leadErr) throw leadErr;

      if (Object.keys(answers).length > 0) {
        const { error: respErr } = await supabase.from("research_responses").insert({
          lead_id: lead.id,
          survey_version: SURVEY_VERSION,
          answers,
          submitted_by_user_id: user.id,
        });
        if (respErr) throw respErr;
      }

      toast.success("Survey saved");
      navigate(`/admin/research/${lead.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout variant="admin">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/research")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">New survey</h1>
            <p className="text-muted-foreground mt-1 text-sm">Capture in-person market research.</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Business profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Business name *" value={profile.business_name} onChange={(v) => setProfile({ ...profile, business_name: v })} />
            <Field label="Contact name" value={profile.contact_name} onChange={(v) => setProfile({ ...profile, contact_name: v })} />
            <div>
              <Label>Business type</Label>
              <Select value={profile.business_type} onValueChange={(v) => setProfile({ ...profile, business_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {RESEARCH_BUSINESS_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="Address" value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} />
            <Field label="City / Town" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email (optional)" type="email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
              <Field label="Phone (optional)" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={profile.notes} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Questionnaire</CardTitle>
            <p className="text-xs text-muted-foreground">Tap to answer. Some follow-up questions appear based on previous answers.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {visibleQuestions.map((q, idx) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-base font-medium leading-snug">
                  <span className="text-muted-foreground mr-2 text-sm">Q{idx + 1}.</span>
                  {q.label}
                </Label>
                {q.type === "single" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {q.options.map((o) => {
                      const active = answers[q.id] === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setAnswer(q.id, o.value)}
                          className={`relative rounded-xl border-2 p-3 text-sm text-left transition min-h-[52px] ${
                            active ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                          }`}
                        >
                          {active && (
                            <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                ) : q.type === "text" ? (
                  <Textarea
                    rows={q.multiline ? 3 : 1}
                    placeholder={q.placeholder}
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-4">
          <Button onClick={submit} disabled={saving} size="lg" className="shadow-lg">
            {saving ? "Saving…" : "Save survey"}
          </Button>
        </div>
      </div>
    </PortalLayout>
  );
};

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default NewResearchLead;
