import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, BarChart3, Download, FlaskConical } from "lucide-react";
import { LEAD_STATUSES } from "@/lib/survey";
import { format } from "date-fns";
import { exportLeadsCSV, exportLeadsXLSX } from "@/lib/researchExport";
import { toast } from "sonner";

const ResearchLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      const [{ data: ls }, { data: rs }] = await Promise.all([
        supabase.from("research_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("research_responses").select("lead_id, answers"),
      ]);
      setLeads(ls || []);
      setResponses(rs || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.business_name?.toLowerCase().includes(q) ||
        l.contact_name?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.business_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCSV = () => {
    try {
      exportLeadsCSV(leads, responses);
      toast.success("CSV downloaded");
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const handleXLSX = () => {
    try {
      exportLeadsXLSX(leads, responses);
      toast.success("Excel file downloaded");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <PortalLayout variant="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FlaskConical className="h-7 w-7 text-primary" /> Market Research
            </h1>
            <p className="text-muted-foreground mt-1">In-person survey leads & trial pipeline.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/research/analytics">
              <Button variant="outline"><BarChart3 className="mr-2 h-4 w-4" /> Analytics</Button>
            </Link>
            <Button variant="outline" onClick={handleCSV} disabled={leads.length === 0}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={handleXLSX} disabled={leads.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Link to="/admin/research/new">
              <Button><Plus className="mr-2 h-4 w-4" /> New survey</Button>
            </Link>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by business, contact, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{filtered.length} lead{filtered.length === 1 ? "" : "s"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No leads match.</p>
            ) : (
              <div className="divide-y">
                {filtered.map((l) => (
                  <Link key={l.id} to={`/admin/research/${l.id}`} className="block py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{l.business_name}</p>
                          {l.business_type && <Badge variant="outline" className="text-xs">{l.business_type}</Badge>}
                          {l.is_trial_lead && <Badge className="text-xs bg-amber-500 hover:bg-amber-500">Trial Lead</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {l.contact_name || "—"}{l.city ? ` · ${l.city}` : ""} · {format(new Date(l.created_at), "d MMM yyyy")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize whitespace-nowrap">
                        {LEAD_STATUSES.find((s) => s.value === l.status)?.label || l.status}
                      </Badge>
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

export default ResearchLeads;
