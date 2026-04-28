import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SURVEY_QUESTIONS, getOptionLabel, getQuestion } from "@/lib/survey";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

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

  const total = responses.length;

  const stats = useMemo(() => {
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
    const c1 = counts("q1_has_screen");
    const c4 = counts("q4_interested");
    const c5 = counts("q5_pay_40_50");
    const c8 = counts("q8_ai_video");
    const c9 = counts("q9_trial");
    return {
      hasTV: pct(c1.yes || 0),
      interested: pct((c4.yes || 0) + (c4.maybe || 0)),
      payTier: pct(c5.yes || 0),
      aiVideo: pct(c8.yes || 0),
      trial: pct(c9.yes || 0),
    };
  }, [responses, total]);

  const distribution = (qid: string) => {
    const q = getQuestion(qid);
    if (!q || q.type !== "single") return [];
    const counts: Record<string, number> = {};
    for (const r of responses) {
      const v = r.answers?.[qid];
      if (v == null || v === "") continue;
      counts[v] = (counts[v] || 0) + 1;
    }
    return q.options.map((o) => ({ name: o.label, value: counts[o.value] || 0 }));
  };

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
              {total} survey response{total === 1 ? "" : "s"} · {leads.length} lead{leads.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : total === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No survey data yet.</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <KPI label="Have a TV/screen" value={`${stats.hasTV}%`} />
              <KPI label="Interested in product" value={`${stats.interested}%`} />
              <KPI label="Willing to pay £40–£50" value={`${stats.payTier}%`} />
              <KPI label="Want AI video feature" value={`${stats.aiVideo}%`} />
              <KPI label="Want free trial" value={`${stats.trial}%`} />
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
        )}
      </div>
    </PortalLayout>
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
