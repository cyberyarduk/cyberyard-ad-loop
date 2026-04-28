import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

interface Client {
  id: string;
  name: string;
  city: string | null;
  status: string;
  monthly_price_pence: number | null;
  screen_count: number | null;
  signed_up_by_salesperson_id: string | null;
}

const formatGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

const SalesClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, city, status, monthly_price_pence, screen_count, signed_up_by_salesperson_id")
        .order("name");
      setClients((data as Client[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalLayout variant="sales">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All clients</h1>
          <p className="text-muted-foreground mt-1">Search the entire client base.</p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or city…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No clients match your search.</p>
            ) : (
              <div className="divide-y">
                {filtered.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.city || "—"} · {c.screen_count ? `${c.screen_count} screen${c.screen_count > 1 ? "s" : ""}` : "—"}
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

export default SalesClients;
