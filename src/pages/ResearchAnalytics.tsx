import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  SURVEY_VERSION,
  POST_TRIAL_SURVEY_VERSION,
  POST_TRIAL_QUESTIONS,
  getQuestion,
} from "@/lib/survey";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#0EA5E9", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const ResearchAnalytics = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: ls }, { data: rs }] = await Promise.all([
        supabase.from("research_leads").select("*"),
        supabase.from("research_responses").select("*"),
      ]);
      setLeads(ls || []);
      setResponses(rs || []);
      setLoading(false);
    };
    load();
  }, []);

  const beforeResponses = useMemo(() => responses.filter((r) => r.survey_version === SURVEY_VERSION), [responses]);
  const afterResponses = useMemo(() => responses.filter((r) => r.survey_version === POST_TRIAL_SURVEY_VERSION), [responses]);

  const businessTypeDist = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of leads) {
      const k = l.business_type || "Unknown";
      c[k] = (c[k] || 0) + 1;
    }
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [leads]);

  return (
    <PortalLayout variant="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/research")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Research Analytics</h1>
            <p className="text-muted-foreground mt-1">
              {beforeResponses.length} pre-trial · {afterResponses.length} post-trial · {leads.length} lead{leads.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="before">Before trial</TabsTrigger>
              <TabsTrigger value="after">After trial</TabsTrigger>
            </TabsList>

            <TabsContent value="before" className="space-y-4 mt-4">
              <BeforeAnalytics responses={beforeResponses} businessTypeDist={businessTypeDist} />
            </TabsContent>

            <TabsContent value="after" className="space-y-4 mt-4">
              <AfterAnalytics responses={afterResponses} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PortalLayout>
  );
};

// ---------- BEFORE TRIAL ----------
const BeforeAnalytics = ({ responses, businessTypeDist }: { responses: any[]; businessTypeDist: any[] }) => {
  const total = responses.length;
  const counts = (qid: string) => {
    const map: Record<string, number> = {};
    for (const r of responses) {
      const v = r.answers?.[qid];
      if (v == null || v === "") continue;
      map[v] = (map[v] || 0) + 1;
    }
    return map;
  };
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  const distribution = (qid: string) => {
    const q = getQuestion(qid);
    if (!q || q.type !== "single") return [];
    const c = counts(qid);
    return q.options.map((o) => ({ name: o.label, value: c[o.value] || 0 }));
  };

  const c1 = counts("q1_has_screen");
  const c4 = counts("q4_interested");
  const c5 = counts("q5_pay_40_50");
  const c8 = counts("q8_ai_video");
  const c9 = counts("q9_trial");

  if (total === 0) {
    return <Card><CardContent className="py-16 text-center text-muted-foreground">No pre-trial survey data yet.</CardContent></Card>;
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="Have a TV/screen" value={`${pct(c1.yes || 0)}%`} />
        <KPI label="Interested in product" value={`${pct((c4.yes || 0) + (c4.maybe || 0))}%`} />
        <KPI label="Willing to pay £40–£50" value={`${pct(c5.yes || 0)}%`} />
        <KPI label="Want AI video feature" value={`${pct(c8.yes || 0)}%`} />
        <KPI label="Want free trial" value={`${pct(c9.yes || 0)}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <PieCard title="TV / Screen ownership" data={distribution("q1_has_screen")} />
        <PieCard title="Interest in promotion system" data={distribution("q4_interested")} />
        <BarCard title="Preferred price range (if not £40–£50)" data={distribution("q5a_price_pref")} />
        <BarCard title="Promotion update frequency" data={distribution("q7_update_freq")} />
        <PieCard title="AI photo→video interest" data={distribution("q8_ai_video")} />
        <PieCard title="Free trial interest" data={distribution("q9_trial")} />
        <BarCard title="Screen preference" data={distribution("q6_screen_pref")} />
        <BarCard title="Update difficulty" data={distribution("q3_update_ease")} />
        <BarCard title="Promotion methods used" data={distribution("q2a_promo_method")} />
        <BarCard title="Business types surveyed" data={businessTypeDist} />
      </div>
    </>
  );
};

// ---------- AFTER TRIAL ----------
const AfterAnalytics = ({ responses }: { responses: any[] }) => {
  const total = responses.length;

  const singleCounts = (qid: string) => {
    const map: Record<string, number> = {};
    for (const r of responses) {
      const v = r.answers?.[qid];
      if (v == null || v === "") continue;
      map[v] = (map[v] || 0) + 1;
    }
    return map;
  };
  const multiCounts = (qid: string) => {
    const map: Record<string, number> = {};
    for (const r of responses) {
      const v = r.answers?.[qid];
      if (!Array.isArray(v)) continue;
      for (const item of v) map[item] = (map[item] || 0) + 1;
    }
    return map;
  };
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  const dist = (qid: string) => {
    const q = POST_TRIAL_QUESTIONS.find((x) => x.id === qid);
    if (!q || (q.type !== "single" && q.type !== "multi")) return [];
    const c = q.type === "multi" ? multiCounts(qid) : singleCounts(qid);
    return q.options.map((o) => ({ name: o.label, value: c[o.value] || 0 }));
  };

  // NPS calculation (0-10 scale)
  const nps = useMemo(() => {
    if (total === 0) return null;
    let promoters = 0, detractors = 0, scored = 0;
    for (const r of responses) {
      const v = r.answers?.["pt9_nps"];
      const n = v == null ? NaN : Number(v);
      if (!Number.isFinite(n)) continue;
      scored++;
      if (n >= 9) promoters++;
      else if (n <= 6) detractors++;
    }
    if (scored === 0) return null;
    return Math.round(((promoters - detractors) / scored) * 100);
  }, [responses, total]);

  const used = singleCounts("pt1_used");
  const cont = singleCounts("pt7_continue");
  const value = singleCounts("pt6_value");
  const usedAi = singleCounts("pt3_used_ai");

  if (total === 0) {
    return <Card><CardContent className="py-16 text-center text-muted-foreground">No post-trial survey data yet.</CardContent></Card>;
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="NPS Score" value={nps == null ? "—" : `${nps}`} />
        <KPI label="Used regularly" value={`${pct(used.yes_regularly || 0)}%`} />
        <KPI label="Want to continue" value={`${pct(cont.yes || 0)}%`} />
        <KPI label="Sees value" value={`${pct(value.yes || 0)}%`} />
        <KPI label="Used AI generator" value={`${pct(usedAi.yes || 0)}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <PieCard title="Did they use the system?" data={dist("pt1_used")} />
        <BarCard title="Ease of use" data={dist("pt2_ease")} />
        <PieCard title="Used AI video generator" data={dist("pt3_used_ai")} />
        <BarCard title="AI generator usefulness" data={dist("pt3a_ai_useful")} />
        <BarCard title="Engagement observed (multi-select)" data={dist("pt4_engagement")} />
        <BarCard title="Estimated impact" data={dist("pt4a_impact")} />
        <PieCard title="Easier to promote products?" data={dist("pt5_easier_promote")} />
        <PieCard title="Updated promotions more often?" data={dist("pt5a_more_frequent")} />
        <PieCard title="Adds value to business?" data={dist("pt6_value")} />
        <PieCard title="Continue after trial?" data={dist("pt7_continue")} />
        <BarCard title="Plan they'd choose" data={dist("pt7a_plan")} />
        <BarCard title="Willing to pay (£/month)" data={dist("pt8_price")} />
        <PieCard title="Pay more if it saves time + boosts sales" data={dist("pt8a_pay_more")} />
        <BarCard title="NPS distribution (0–10)" data={dist("pt9_nps")} />
      </div>
    </>
  );
};

const KPI = ({ label, value }: { label: string; value: string }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </CardContent>
  </Card>
);

const PieCard = ({ title, data }: { title: string; data: { name: string; value: number }[] }) => {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-12 text-center">No data</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={filtered} dataKey="value" nameKey="name" outerRadius={80} label={(e: any) => `${e.name} (${e.value})`}>
                  {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BarCard = ({ title, data }: { title: string; data: { name: string; value: number }[] }) => {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-12 text-center">No data</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResearchAnalytics;
