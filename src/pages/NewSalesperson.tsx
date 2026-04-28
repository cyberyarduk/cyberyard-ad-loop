import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

const NewSalesperson = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    full_name: "",
    employee_number: "",
    email: "",
    password: "",
    phone: "",
    area: "",
    monthly_target: 100,
    start_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const update = (k: string, v: any) => setData((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.full_name || !data.employee_number || !data.email || data.password.length < 8) {
      toast.error("Name, employee #, email and password (8+ chars) are required.");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("create-salesperson", {
        body: {
          ...data,
          monthly_target: Number(data.monthly_target) || 100,
          phone: data.phone || null,
          area: data.area || null,
          notes: data.notes || null,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(typeof result.error === "string" ? result.error : JSON.stringify(result.error));
      toast.success(`${data.full_name} added to the sales team! 🎉`);
      navigate("/admin/salespeople");
    } catch (e: any) {
      toast.error(e.message || "Failed to create salesperson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout variant="admin">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/salespeople")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">New salesperson</h1>
          <p className="text-muted-foreground mt-1">They'll be able to sign in immediately with these details.</p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Salesperson details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full name *</Label>
                  <Input value={data.full_name} onChange={(e) => update("full_name", e.target.value)} required />
                </div>
                <div>
                  <Label>Employee number *</Label>
                  <Input value={data.employee_number} onChange={(e) => update("employee_number", e.target.value)} required placeholder="e.g. EMP001" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} required />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={data.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Temporary password * (min 8 chars)</Label>
                <Input type="password" value={data.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Area</Label>
                  <Input value={data.area} onChange={(e) => update("area", e.target.value)} placeholder="e.g. North London" />
                </div>
                <div>
                  <Label>Monthly target</Label>
                  <Input type="number" value={data.monthly_target} onChange={(e) => update("monthly_target", e.target.value)} />
                </div>
                <div>
                  <Label>Start date</Label>
                  <Input type="date" value={data.start_date} onChange={(e) => update("start_date", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={data.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
                {loading ? "Creating…" : "Create salesperson"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default NewSalesperson;
