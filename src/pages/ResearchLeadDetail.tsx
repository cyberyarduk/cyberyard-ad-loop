import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUSES, SURVEY_QUESTIONS, getOptionLabel } from "@/lib/survey";
import { format } from "date-fns";
import { toast } from "sonner";

const ResearchLeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: l } = await supabase.from("research_leads").select("*").eq("id", id).maybeSingle();
      const { data: r } = await supabase
        .from("research_responses")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLead(l);
      setResponse(r);
      setLoading(false);
    };
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    const { error } = await supabase.from("research_leads").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLead((p: any) => ({ ...p, status }));
    toast.success("Status updated");
  };

  const remove = async () => {
    if (!id || !confirm("Delete this lead and its survey?")) return;
    const { error } = await supabase.from("research_leads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    navigate("/admin/research");
  };

  if (loading) {
    return <PortalLayout variant="admin"><p className="p-8 text-muted-foreground">Loading…</p></PortalLayout>;
  }
  if (!lead) {
    return <PortalLayout variant="admin"><p className="p-8">Lead not found. <Link to="/admin/research" className="underline">Back</Link></p></PortalLayout>;
  }

  const answers = response?.answers || {};
  const visible = SURVEY_QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));

  return (
    <PortalLayout variant="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/research")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{lead.business_name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Surveyed {format(new Date(lead.created_at), "d MMM yyyy")}
              {lead.is_trial_lead && <span className="ml-2"><Badge className="bg-amber-500 hover:bg-amber-500">Trial Lead</Badge></span>}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={remove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>

        {lead.is_trial_lead && lead.status !== "converted" && (
          <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="font-semibold">Trial accepted — ready to onboard?</p>
                <p className="text-sm text-muted-foreground">Convert this lead into a paying customer. Survey details will pre-fill the wizard.</p>
              </div>
              <Button
                onClick={() => navigate("/admin/new-client", { state: { prefill: {
                  name: lead.business_name,
                  business_type: lead.business_type || "",
                  primary_contact_name: lead.contact_name || "",
                  primary_contact_email: lead.email || "",
                  primary_contact_phone: lead.phone || "",
                  billing_email: lead.email || "",
                  address_line1: lead.address || "",
                  city: lead.city || "",
                  notes: lead.notes || "",
                  research_lead_id: lead.id,
                }}})}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Convert to Customer
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Profile & status</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lead.business_type && <Row icon={<Building2 className="h-4 w-4" />} value={lead.business_type} />}
            {lead.contact_name && <Row label="Contact" value={lead.contact_name} />}
            {lead.email && <Row icon={<Mail className="h-4 w-4" />} value={lead.email} />}
            {lead.phone && <Row icon={<Phone className="h-4 w-4" />} value={lead.phone} />}
            {(lead.address || lead.city) && <Row icon={<MapPin className="h-4 w-4" />} value={[lead.address, lead.city].filter(Boolean).join(", ")} />}
            {lead.notes && <Row label="Notes" value={lead.notes} />}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Select value={lead.status} onValueChange={updateStatus}>
                <SelectTrigger className="sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Survey responses</CardTitle></CardHeader>
          <CardContent>
            {!response ? (
              <p className="text-sm text-muted-foreground">No survey submitted.</p>
            ) : (
              <div className="space-y-4">
                {visible.map((q, idx) => {
                  const v = answers[q.id];
                  const display = v == null || v === "" ? <span className="text-muted-foreground italic">No answer</span>
                    : q.type === "single" ? <span className="font-medium">{getOptionLabel(q.id, v)}</span>
                    : <span className="font-medium whitespace-pre-wrap">{v}</span>;
                  return (
                    <div key={q.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <p className="text-xs text-muted-foreground">Q{idx + 1}. {q.label}</p>
                      <p className="mt-1">{display}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

const Row = ({ icon, label, value }: { icon?: React.ReactNode; label?: string; value: string }) => (
  <div className="flex items-start gap-2">
    {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
    {label && <span className="text-muted-foreground w-20 shrink-0">{label}</span>}
    <span className="flex-1">{value}</span>
  </div>
);

export default ResearchLeadDetail;
