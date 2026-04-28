import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, Calendar, PoundSterling } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const SalespersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: spRow } = await supabase.from("salespeople").select("*").eq("id", id).maybeSingle();
      const { data: cs } = await supabase
        .from("companies")
        .select("id, name, business_type, city, status, monthly_price_pence, screen_count, created_at")
        .eq("signed_up_by_salesperson_id", id)
        .order("created_at", { ascending: false });
      setSp(spRow);
      setCompanies(cs || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = companies.filter((c) => new Date(c.created_at) >= monthStart).length;
  const mrrPence = companies.reduce((s, c) => s + (c.monthly_price_pence || 0), 0);

  // group by business type
  const byType: Record<string, number> = {};
  for (const c of companies) {
    const k = c.business_type || "Unknown";
    byType[k] = (byType[k] || 0) + 1;
  }

  return (
    <PortalLayout variant="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/salespeople")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{sp?.full_name || "Loading…"}</h1>
            {sp && (
              <p className="text-muted-foreground mt-1">
                #{sp.employee_number} · {sp.email} · {sp.area || "No area"}
              </p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <Stat label="Signed up this month" value={`${thisMonth}`} sub={`Target ${sp?.monthly_target || 100}`} />
          <Stat label="All-time signups" value={`${companies.length}`} />
          <Stat label="MRR generated" value={`£${(mrrPence / 100).toFixed(0)}`} />
          <Stat label="Active" value={sp?.active ? "Yes" : "No"} />
        </div>

        {Object.keys(byType).length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Signups by business type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(byType).map(([t, n]) => (
                  <Badge key={t} variant="secondary" className="text-sm py-1.5 px-3">
                    {t} · {n}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Clients signed up</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : companies.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No clients signed up yet.</p>
            ) : (
              <div className="divide-y">
                {companies.map((c) => (
                  <Link
                    key={c.id}
                    to={`/companies/${c.id}`}
                    className="block py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <p className="font-medium truncate">{c.name}</p>
                          {c.business_type && <Badge variant="outline" className="text-xs">{c.business_type}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {c.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>}
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(c.created_at), "d MMM yyyy")}</span>
                          {c.monthly_price_pence != null && <span className="flex items-center gap-1"><PoundSterling className="h-3 w-3" />{(c.monthly_price_pence / 100).toFixed(0)}/mo · {c.screen_count} screen{c.screen_count === 1 ? "" : "s"}</span>}
                        </div>
                      </div>
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className="capitalize">{c.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export default SalespersonDetail;
