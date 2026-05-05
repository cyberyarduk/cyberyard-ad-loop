import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  SURVEY_QUESTIONS,
  POST_TRIAL_SURVEY_VERSION,
  POST_TRIAL_QUESTIONS,
  getQuestion,
} from "@/lib/survey";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#0EA5E9", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

// Price-bucket midpoints used to estimate an average expected price.
const PRICE_MIDPOINTS: Record<string, number> = {
  "10_20": 15, "20_30": 25, "30_40": 35, "40_50": 45, "50_plus": 60,
};

const ResearchAnalytics = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [screenFilter, setScreenFilter] = useState<string>("all");

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

  // Map: lead_id -> pre-trial answers (any non-post-trial version)
  const preTrialByLead = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of responses) {
      if (r.survey_version === POST_TRIAL_SURVEY_VERSION) continue;
      if (!map.has(r.lead_id)) map.set(r.lead_id, r.answers || {});
    }
    return map;
  }, [responses]);

  // Apply filters to lead list, then derive matching responses.
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (businessTypeFilter !== "all" && (l.business_type || "Unknown") !== businessTypeFilter) return false;
      if (cityFilter !== "all" && (l.city || "Unknown") !== cityFilter) return false;
      if (screenFilter !== "all") {
        const ans = preTrialByLead.get(l.id) || {};
        const has = ans.q1_has_screen;
        if (screenFilter === "yes" && has !== "yes") return false;
        if (screenFilter === "no" && has !== "no") return false;
      }
      return true;
    });
  }, [leads, businessTypeFilter, cityFilter, screenFilter, preTrialByLead]);

  const filteredLeadIds = useMemo(() => new Set(filteredLeads.map((l) => l.id)), [filteredLeads]);

  const beforeResponses = useMemo(
    () => responses.filter((r) => r.survey_version !== POST_TRIAL_SURVEY_VERSION && filteredLeadIds.has(r.lead_id)),
    [responses, filteredLeadIds]
  );
  const afterResponses = useMemo(
    () => responses.filter((r) => r.survey_version === POST_TRIAL_SURVEY_VERSION && filteredLeadIds.has(r.lead_id)),
    [responses, filteredLeadIds]
  );

  const businessTypeDist = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of filteredLeads) {
      const k = l.business_type || "Unknown";
      c[k] = (c[k] || 0) + 1;
    }
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const cityDist = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of filteredLeads) {
      const k = l.city || "Unknown";
      c[k] = (c[k] || 0) + 1;
    }
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const businessTypeOptions = useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) s.add(l.business_type || "Unknown");
    return Array.from(s).sort();
  }, [leads]);
  const cityOptions = useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) s.add(l.city || "Unknown");
    return Array.from(s).sort();
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
              {beforeResponses.length} pre-trial · {afterResponses.length} post-trial · {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FilterSelect label="Business type" value={businessTypeFilter} onChange={setBusinessTypeFilter}
              options={[{ value: "all", label: "All business types" }, ...businessTypeOptions.map((b) => ({ value: b, label: b }))]} />
            <FilterSelect label="Location" value={cityFilter} onChange={setCityFilter}
              options={[{ value: "all", label: "All locations" }, ...cityOptions.map((c) => ({ value: c, label: c }))]} />
            <FilterSelect label="Has screen" value={screenFilter} onChange={setScreenFilter}
              options={[
                { value: "all", label: "All" },
                { value: "yes", label: "Has a screen" },
                { value: "no", label: "No screen" },
              ]} />
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="before">Before trial</TabsTrigger>
              <TabsTrigger value="after">After trial</TabsTrigger>
            </TabsList>

            <TabsContent value="before" className="space-y-4 mt-4">
              <BeforeAnalytics
                responses={beforeResponses}
                businessTypeDist={businessTypeDist}
                cityDist={cityDist}
              />
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

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <div className="space-y-1">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

// ---------- BEFORE TRIAL ----------
const BeforeAnalytics = ({ responses, businessTypeDist, cityDist }: { responses: any[]; businessTypeDist: any[]; cityDist: any[] }) => {
  const total = responses.length;

  const singleCounts = (qid: string) => {
    const map: Record<string, number> = {};
    for (const r of responses) {
      const v = r.answers?.[qid];
      if (v == null || v === "" || Array.isArray(v)) continue;
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

  // Number of responses that actually saw this question (so percentages reflect the relevant base).
  const answeredCount = (qid: string) => {
    let n = 0;
    for (const r of responses) {
      const v = r.answers?.[qid];
      if (v == null || v === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;
      n++;
    }
    return n;
  };

  const pct = (n: number, base = total) => base > 0 ? Math.round((n / base) * 100) : 0;

  const dist = (qid: string) => {
    const q = SURVEY_QUESTIONS.find((x) => x.id === qid) || getQuestion(qid);
    if (!q || (q.type !== "single" && q.type !== "multi")) return [];
    const c = q.type === "multi" ? multiCounts(qid) : singleCounts(qid);
    const base = q.type === "multi" ? answeredCount(qid) : Object.values(c).reduce((s, n) => s + n, 0);
    return q.options.map((o) => {
      const value = c[o.value] || 0;
      return { name: o.label, value, percent: pct(value, base) };
    });
  };

  // ----- Headline KPIs -----
  const c1 = singleCounts("q1_has_screen");
  const c5 = singleCounts("q5_ai_video_interest");
  const c6 = singleCounts("q6_try_today");
  const c7 = singleCounts("q7_price_reasonable");
  const c10 = singleCounts("q10_trial_interest");

  // Average expected price across q7a (and q7 yes => £40-50 midpoint £45)
  const avgExpectedPrice = useMemo(() => {
    let sum = 0, n = 0;
    for (const r of responses) {
      const a = r.answers || {};
      let p: number | null = null;
      if (a.q7_price_reasonable === "yes") p = 45;
      else if (typeof a.q7a_expected_price === "string" && PRICE_MIDPOINTS[a.q7a_expected_price] != null) {
        p = PRICE_MIDPOINTS[a.q7a_expected_price];
      }
      if (p != null) { sum += p; n++; }
    }
    return n === 0 ? null : Math.round(sum / n);
  }, [responses]);

  if (total === 0) {
    return <Card><CardContent className="py-16 text-center text-muted-foreground">No pre-trial survey data yet for the selected filters.</CardContent></Card>;
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="With screens" value={`${pct(c1.yes || 0)}%`} sub={`${c1.yes || 0}/${total}`} />
        <KPI label="Interested in product" value={`${pct((c6.yes || 0) + (c6.maybe || 0))}%`} sub={`${(c6.yes || 0) + (c6.maybe || 0)}/${total}`} />
        <KPI label="Willing to pay £40–£50" value={`${pct(c7.yes || 0)}%`} sub={`${c7.yes || 0}/${total}`} />
        <KPI label="Avg expected price" value={avgExpectedPrice == null ? "—" : `£${avgExpectedPrice}`} />
        <KPI label="Want free trial" value={`${pct(c10.yes || 0)}%`} sub={`${c10.yes || 0}/${total}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Want phone control" value={`${pct((singleCounts("q4_phone_control_interest").yes || 0))}%`} />
        <KPI label="Want photo→video" value={`${pct((c5.yes || 0))}%`} />
        <KPI label="Use screen for promos" value={`${pct((singleCounts("q1a_uses_for_promo").yes || 0), c1.yes || 0)}% of those with a screen`} />
        <KPI label="Spend on advertising" value={`${pct((singleCounts("q2a_spends_on_ads").yes || 0))}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <PieCard title="Have a screen / device?" data={dist("q1_has_screen")} />
        <PieCard title="Use screen for promotions" data={dist("q1a_uses_for_promo")} />
        <BarCard title="What is displayed" data={dist("q1b_displays")} />
        <BarCard title="How they update screens" data={dist("q1c_update_method")} />
        <PieCard title="Does the screen cost to run?" data={dist("q1d_has_cost")} />
        <BarCard title="Monthly cost to run screen" data={dist("q1e_cost_range")} />
        <PieCard title="Would consider a screen (no-screen group)" data={dist("q1f_consider_screen")} />
        <BarCard title="In-store promotion methods" data={dist("q2_promo_methods")} />
        <PieCard title="Spends on advertising?" data={dist("q2a_spends_on_ads")} />
        <BarCard title="Monthly ad/promo spend" data={dist("q2b_ad_spend_range")} />
        <BarCard title="How easy to update promotions" data={dist("q3_update_ease")} />
        <PieCard title="Phone-controlled screen interest" data={dist("q4_phone_control_interest")} />
        <PieCard title="AI photo → video interest" data={dist("q5_ai_video_interest")} />
        <PieCard title="Would try Cyberyard today" data={dist("q6_try_today")} />
        <PieCard title="£40–£50/month reasonable?" data={dist("q7_price_reasonable")} />
        <BarCard title="Expected monthly price (if no/maybe)" data={dist("q7a_expected_price")} />
        <BarCard title="Promotion update frequency" data={dist("q8_update_frequency")} />
        <BarCard title="Setup preference" data={dist("q9_setup_pref")} />
        <PieCard title="Free 2-week trial interest" data={dist("q10_trial_interest")} />
        <BarCard title="Business types surveyed" data={businessTypeDist.map((d) => ({ ...d, percent: pct(d.value) }))} />
        <BarCard title="Locations surveyed" data={cityDist.map((d) => ({ ...d, percent: pct(d.value) }))} />
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
  const pct = (n: number, base = total) => base > 0 ? Math.round((n / base) * 100) : 0;
  const dist = (qid: string) => {
    const q = POST_TRIAL_QUESTIONS.find((x) => x.id === qid);
    if (!q || (q.type !== "single" && q.type !== "multi")) return [];
    const c = q.type === "multi" ? multiCounts(qid) : singleCounts(qid);
    const base = q.type === "multi" ? total : Object.values(c).reduce((s, n) => s + n, 0);
    return q.options.map((o) => {
      const value = c[o.value] || 0;
      return { name: o.label, value, percent: pct(value, base) };
    });
  };

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
    return <Card><CardContent className="py-16 text-center text-muted-foreground">No post-trial survey data yet for the selected filters.</CardContent></Card>;
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

const KPI = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

type ChartDatum = { name: string; value: number; percent?: number };

const PieCard = ({ title, data }: { title: string; data: ChartDatum[] }) => {
  const filtered = data.filter((d) => d.value > 0);
  const sum = filtered.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-12 text-center">No data</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filtered}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={(e: any) => {
                    const p = sum > 0 ? Math.round((e.value / sum) * 100) : 0;
                    return `${e.name} ${p}%`;
                  }}
                >
                  {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any, _n: any, p: any) => {
                  const pc = sum > 0 ? Math.round((Number(v) / sum) * 100) : 0;
                  return [`${v} (${pc}%)`, p?.payload?.name];
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BarCard = ({ title, data }: { title: string; data: ChartDatum[] }) => {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-12 text-center">No data</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: any, _n: any, p: any) => [`${p?.payload?.value} (${v}%)`, "Responses"]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="percent" name="% of responses" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResearchAnalytics;
