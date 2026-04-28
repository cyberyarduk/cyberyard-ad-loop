import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
// Card removed — using premium-card divs
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Users, Building2, PoundSterling, TrendingUp, Plus, UserPlus } from "lucide-react";

const formatGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    salespeople: 0,
    mrrPence: 0,
    thisMonth: 0,
  });
  const [topSales, setTopSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: companies }, { data: sps }] = await Promise.all([
        supabase.from("companies").select("id, status, monthly_price_pence, signed_up_by_salesperson_id, created_at"),
        supabase.from("salespeople").select("id, full_name, employee_number, area, monthly_target, active"),
      ]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalClients = companies?.length || 0;
      const activeClients = (companies || []).filter((c) => c.status === "active").length;
      const mrrPence = (companies || []).reduce((s, c) => s + (c.monthly_price_pence || 0), 0);
      const thisMonth = (companies || []).filter((c) => new Date(c.created_at) >= monthStart).length;

      setStats({
        totalClients,
        activeClients,
        salespeople: (sps || []).filter((s) => s.active).length,
        mrrPence,
        thisMonth,
      });

      // Per-salesperson signups
      const ranked = (sps || []).map((sp) => {
        const theirs = (companies || []).filter((c) => c.signed_up_by_salesperson_id === sp.id);
        const month = theirs.filter((c) => new Date(c.created_at) >= monthStart).length;
        return { ...sp, total: theirs.length, month };
      }).sort((a, b) => b.month - a.month);

      setTopSales(ranked);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <PortalLayout variant="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cyberyard CRM</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-1">Admin overview</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/salespeople/new">
              <Button variant="outline" className="rounded-full">
                <UserPlus className="mr-2 h-4 w-4" /> New salesperson
              </Button>
            </Link>
            <Link to="/admin/new-client">
              <Button className="rounded-full shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> New client
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Total clients" value={stats.totalClients.toString()} tone="bg-lavender" />
          <StatCard icon={TrendingUp} label="Signups this month" value={stats.thisMonth.toString()} tone="bg-mint" />
          <StatCard icon={PoundSterling} label="MRR" value={formatGBP(stats.mrrPence)} tone="bg-peach" />
          <StatCard icon={Users} label="Active salespeople" value={stats.salespeople.toString()} tone="bg-sky" />
        </div>

        <div className="premium-card card-highlight rounded-2xl p-6">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Salesperson performance — this month</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : topSales.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No salespeople yet.</p>
              <Link to="/admin/salespeople/new">
                <Button className="rounded-full"><UserPlus className="mr-2 h-4 w-4" /> Add first salesperson</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {topSales.map((sp) => {
                const pct = Math.min(100, (sp.month / sp.monthly_target) * 100);
                return (
                  <div key={sp.id} className="py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="font-medium">{sp.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          #{sp.employee_number} · {sp.area || "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {sp.month} / {sp.monthly_target} this month
                        </p>
                        <p className="text-xs text-muted-foreground">{sp.total} all-time</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-foreground transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

const StatCard = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) => (
  <div className="premium-card card-highlight hover-lift rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={`p-2 ${tone} rounded-lg`}>
        <Icon className="h-4 w-4 text-foreground" />
      </div>
    </div>
    <p className="text-2xl font-semibold tracking-tight">{value}</p>
  </div>
);

export default AdminDashboard;
