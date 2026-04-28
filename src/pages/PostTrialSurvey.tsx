import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { POST_TRIAL_QUESTIONS, POST_TRIAL_SURVEY_VERSION } from "@/lib/survey";

const PostTrialSurvey = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("research_leads").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setLead(data));
  }, [id]);

  const visible = useMemo(
    () => POST_TRIAL_QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)),
    [answers]
  );

  const setAnswer = (qid: string, v: string | string[]) => {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: v };
      for (const q of POST_TRIAL_QUESTIONS) {
        if (q.showIf && !q.showIf(next) && next[q.id] !== undefined) delete next[q.id];
      }
      return next;
    });
  };

  const toggleMulti = (qid: string, value: string) => {
    const current = (answers[qid] as string[]) || [];
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    setAnswer(qid, next);
  };

  const submit = async () => {
    if (!id || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("research_responses").insert({
        lead_id: id,
        survey_version: POST_TRIAL_SURVEY_VERSION,
        answers,
        submitted_by_user_id: user.id,
      });
      if (error) throw error;

      // Auto-progress status based on continue intent
      const continueIntent = answers["pt7_continue"];
      const newStatus = continueIntent === "yes" ? "converted" : "trial_completed";
      await supabase.from("research_leads").update({ status: newStatus }).eq("id", id);

      toast.success("Post-trial survey saved");
      navigate(`/admin/research/${id}`);
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
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/research/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Post-trial survey</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {lead?.business_name ? `For ${lead.business_name}` : "Capture feedback after the 2-week trial."}
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Trial feedback</CardTitle>
            <p className="text-xs text-muted-foreground">Tap to answer. Some follow-ups appear based on previous answers.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {visible.map((q, idx) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-base font-medium leading-snug">
                  <span className="text-muted-foreground mr-2 text-sm">Q{idx + 1}.</span>
                  {q.label}
                </Label>
                {q.type === "single" ? (
                  <div className={`grid gap-2 ${q.options.length > 6 ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3"}`}>
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
                ) : q.type === "multi" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((o) => {
                      const selected = ((answers[q.id] as string[]) || []).includes(o.value);
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => toggleMulti(q.id, o.value)}
                          className={`relative rounded-xl border-2 p-3 text-sm text-left transition min-h-[52px] ${
                            selected ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                          }`}
                        >
                          {selected && (
                            <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Textarea
                    rows={q.multiline ? 3 : 1}
                    placeholder={q.placeholder}
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-4">
          <Button onClick={submit} disabled={saving} size="lg" className="shadow-lg">
            {saving ? "Saving…" : "Save post-trial survey"}
          </Button>
        </div>
      </div>
    </PortalLayout>
  );
};

export default PostTrialSurvey;
