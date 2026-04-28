import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Plus, TrendingUp, Target, Users, PoundSterling } from "lucide-react";

interface Client {
  id: string;
  name: string;
  city: string | null;
  status: string;
  monthly_price_pence: number | null;
  screen_count: number | null;
  created_at: string;
}

const formatGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

const SalesDashboard = () => {
  const { salesperson } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!salesperson) return;
      const { data } = await supabase
        .from("companies")
        .select("id, name, city, status, monthly_price_pence, screen_count, created_at")
        .eq("signed_up_by_salesperson_id", salesperson.id)
        .order("created_at", { ascending: false });
      setClients((data as Client[]) || []);
      setLoading(false);
    };
    load();
  }, [salesperson]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = clients.filter((c) => new Date(c.created_at) >= monthStart);
  const target = salesperson?.monthly_target ?? 100;
  const pct = Math.min(100, (thisMonth.length / target) * 100);
  const mrrPence = clients.reduce((sum, c) => sum + (c.monthly_price_pence || 0), 0);

  return (
    <PortalLayout variant="sales">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-4xl font-bold tracking-tight">{salesperson?.full_name?.split(" ")[0] || "Sales"}</h1>
            <p className="text-muted-foreground mt-1">Here's how this month is shaping up.</p>
          </div>
          <Link to="/sales/new-client">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg">
              <Plus className="mr-2 h-5 w-5" /> Sign up new client
            </Button>
          </Link>
        </div>

        {/* Target tracker */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-rose-500/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" /> Monthly target
                </p>
                <p className="text-3xl font-bold tracking-tight mt-1">
                  {thisMonth.length} <span className="text-muted-foreground text-xl font-medium">/ {target} clients</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-3xl font-bold tracking-tight">{Math.round(pct)}%</p>
              </div>
            </div>
            <Progress value={pct} className="h-3" />
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Total clients signed up" value={clients.length.toString()} />
          <StatCard icon={TrendingUp} label="This month" value={thisMonth.length.toString()} />
          <StatCard icon={PoundSterling} label="MRR generated" value={formatGBP(mrrPence)} />
        </div>

        {/* Recent clients */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your clients</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No clients yet — let's get started.</p>
                <Link to="/sales/new-client">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Sign up first client
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {clients.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.city || "—"} · {c.screen_count ? `${c.screen_count} screen${c.screen_count > 1 ? "s" : ""}` : "No subscription"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {c.monthly_price_pence ? formatGBP(c.monthly_price_pence) + "/mo" : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
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

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </CardContent>
  </Card>
);

export default SalesDashboard;
