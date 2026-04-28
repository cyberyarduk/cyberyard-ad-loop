import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const Salespeople = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: sps } = await supabase
        .from("salespeople")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: companies } = await supabase
        .from("companies")
        .select("id, signed_up_by_salesperson_id, monthly_price_pence, created_at");

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const enriched = (sps || []).map((sp) => {
        const theirs = (companies || []).filter((c) => c.signed_up_by_salesperson_id === sp.id);
        const month = theirs.filter((c) => new Date(c.created_at) >= monthStart).length;
        const mrr = theirs.reduce((s, c) => s + (c.monthly_price_pence || 0), 0);
        return { ...sp, total: theirs.length, month, mrr };
      });
      setList(enriched);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <PortalLayout variant="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Salespeople</h1>
            <p className="text-muted-foreground mt-1">Your sales team and their performance.</p>
          </div>
          <Link to="/admin/salespeople/new">
            <Button><Plus className="mr-2 h-4 w-4" /> New salesperson</Button>
          </Link>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">All salespeople</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : list.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No salespeople yet.</p>
            ) : (
              <div className="divide-y">
                {list.map((sp) => (
                  <div key={sp.id} className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-4">
                      <p className="font-medium">{sp.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{sp.employee_number} · {sp.email}
                      </p>
                    </div>
                    <div className="sm:col-span-2 text-sm">{sp.area || "—"}</div>
                    <div className="sm:col-span-2 text-sm">
                      <span className="font-medium">{sp.month}</span>
                      <span className="text-muted-foreground"> / {sp.monthly_target}</span>
                      <p className="text-xs text-muted-foreground">this month</p>
                    </div>
                    <div className="sm:col-span-2 text-sm">
                      <p className="font-medium">{sp.total}</p>
                      <p className="text-xs text-muted-foreground">all-time</p>
                    </div>
                    <div className="sm:col-span-2 text-right">
                      <Badge variant={sp.active ? "default" : "secondary"}>
                        {sp.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Salespeople;
