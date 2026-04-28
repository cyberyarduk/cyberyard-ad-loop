import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addMonths } from "date-fns";
import { Check, ArrowRight, ArrowLeft, Monitor, Building2, UserCircle2, Banknote, CheckCircle2, Info } from "lucide-react";

interface Props {
  variant: "sales" | "admin";
}

const SCREEN_TIERS = [
  { count: 1, label: "1 screen", price: 3500, description: "Single-staff store" },
  { count: 2, label: "2 screens", price: 4500, description: "Small team" },
  { count: 3, label: "3+ screens", price: 7500, description: "Full retail floor" },
];

const formatGBP = (pence: number) => `£${(pence / 100).toFixed(0)}`;

const NewClientWizard = ({ variant }: Props) => {
  const navigate = useNavigate();
  const { user, salesperson } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    // Step 1 - Company
    name: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    billing_email: "",
    address_line1: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    // Step 2 - Subscription
    screen_count: 1,
    start_date: format(new Date(), "yyyy-MM-dd"),
    // Step 3 - Admin account
    admin_name: "",
    admin_email: "",
    admin_password: "",
    // Step 4 - DD
    dd_account_holder: "",
    dd_sort_code: "",
    dd_account_number: "",
    dd_bank_name: "",
    notes: "",
  });

  const update = (k: string, v: any) => setData((p) => ({ ...p, [k]: v }));

  const selectedTier = SCREEN_TIERS.find((t) => t.count === data.screen_count) || SCREEN_TIERS[0];

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!data.name || !data.primary_contact_name || !data.primary_contact_email || !data.billing_email || !data.address_line1 || !data.city || !data.postcode) {
        toast.error("Please complete all required fields.");
        return false;
      }
    }
    if (s === 3) {
      if (!data.admin_email || !data.admin_name || data.admin_password.length < 8) {
        toast.error("Admin name, email, and password (8+ chars) required.");
        return false;
      }
    }
    if (s === 4) {
      if (data.dd_account_holder && (!data.dd_sort_code || !data.dd_account_number)) {
        toast.error("Please complete the direct debit details or leave them all blank.");
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(5, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const startDate = data.start_date;
      const endDate = format(addMonths(new Date(startDate), 12), "yyyy-MM-dd"); // monthly rolling — placeholder end

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: data.name,
          slug,
          primary_contact_name: data.primary_contact_name,
          primary_contact_email: data.primary_contact_email,
          primary_contact_phone: data.primary_contact_phone || null,
          billing_email: data.billing_email,
          address_line1: data.address_line1,
          city: data.city,
          postcode: data.postcode,
          country: data.country,
          plan_type: "wifi",
          connectivity_type: "wifi",
          price_per_device: selectedTier.price / 100,
          billing_cycle: "monthly",
          term_months: 1,
          start_date: startDate,
          end_date: endDate,
          status: "active",
          screen_count: data.screen_count,
          monthly_price_pence: selectedTier.price,
          billing_start_date: startDate,
          contract_type: "monthly_rolling",
          signed_up_by_salesperson_id: variant === "sales" ? salesperson?.id ?? null : null,
          notes: data.notes || null,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create admin account
      const { error: adminError } = await supabase.functions.invoke("create-company-admin", {
        body: {
          company_id: company.id,
          admin_email: data.admin_email,
          admin_name: data.admin_name,
          admin_password: data.admin_password,
        },
      });
      if (adminError) {
        toast.warning("Company created, but admin account creation failed. Add manually.");
      }

      // DD mandate (mocked)
      if (data.dd_account_holder) {
        await supabase.from("direct_debit_mandates").insert({
          company_id: company.id,
          account_holder_name: data.dd_account_holder,
          sort_code: data.dd_sort_code,
          account_number_last4: data.dd_account_number.slice(-4),
          bank_name: data.dd_bank_name || null,
          status: "mocked",
          is_mock: true,
          created_by_user_id: user.id,
        });
      }

      toast.success(`${data.name} signed up successfully! 🎉`);
      navigate(variant === "sales" ? "/sales" : "/admin");
    } catch (e: any) {
      toast.error(e.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout variant={variant}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sign up new client</h1>
          <p className="text-muted-foreground mt-1">Step {step} of 5</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {[Building2, Monitor, UserCircle2, Banknote, CheckCircle2].map((Icon, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center flex-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                      ? "border-primary text-primary bg-primary/5"
                      : "border-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {n < 5 && <div className={`h-0.5 flex-1 mx-1 ${done ? "bg-primary" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Company details"}
              {step === 2 && "Subscription"}
              {step === 3 && "Company admin account"}
              {step === 4 && "Direct debit"}
              {step === 5 && "Review & confirm"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <Field label="Company name *" value={data.name} onChange={(v) => update("name", v)} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Primary contact name *" value={data.primary_contact_name} onChange={(v) => update("primary_contact_name", v)} />
                  <Field label="Phone" value={data.primary_contact_phone} onChange={(v) => update("primary_contact_phone", v)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Contact email *" type="email" value={data.primary_contact_email} onChange={(v) => update("primary_contact_email", v)} />
                  <Field label="Billing email *" type="email" value={data.billing_email} onChange={(v) => update("billing_email", v)} />
                </div>
                <Field label="Address line 1 *" value={data.address_line1} onChange={(v) => update("address_line1", v)} />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City *" value={data.city} onChange={(v) => update("city", v)} />
                  <Field label="Postcode *" value={data.postcode} onChange={(v) => update("postcode", v)} />
                  <Field label="Country" value={data.country} onChange={(v) => update("country", v)} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label className="mb-3 block">Number of screens *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SCREEN_TIERS.map((t) => {
                      const active = data.screen_count === t.count;
                      return (
                        <button
                          key={t.count}
                          type="button"
                          onClick={() => update("screen_count", t.count)}
                          className={`relative rounded-2xl border-2 p-4 text-left transition ${
                            active
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          {active && (
                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          <p className="text-2xl font-bold">{formatGBP(t.price)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                          <p className="text-sm font-medium mt-1">{t.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label>Start date *</Label>
                    <Input type="date" value={data.start_date} onChange={(e) => update("start_date", e.target.value)} />
                  </div>
                  <div>
                    <Label>Contract</Label>
                    <Input value="Monthly rolling" disabled />
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Total: <strong>{formatGBP(selectedTier.price)} / month</strong>, billed monthly from {data.start_date}. Rolling — cancel any time.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Create the company admin login. They'll receive a confirmation email separately.
                </p>
                <Field label="Admin full name *" value={data.admin_name} onChange={(v) => update("admin_name", v)} />
                <Field label="Admin email *" type="email" value={data.admin_email} onChange={(v) => update("admin_email", v)} />
                <Field label="Temporary password * (min 8 chars)" type="password" value={data.admin_password} onChange={(v) => update("admin_password", v)} />
              </>
            )}

            {step === 4 && (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>GoCardless integration coming soon.</strong> For now, capture details below and we'll save them as a <em>mock mandate</em>. When GoCardless goes live, real mandates will be created automatically. Leave blank to skip.
                  </AlertDescription>
                </Alert>
                <Field label="Account holder name" value={data.dd_account_holder} onChange={(v) => update("dd_account_holder", v)} />
                <Field label="Bank name (optional)" value={data.dd_bank_name} onChange={(v) => update("dd_bank_name", v)} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Sort code (e.g. 12-34-56)" value={data.dd_sort_code} onChange={(v) => update("dd_sort_code", v)} />
                  <Field label="Account number" value={data.dd_account_number} onChange={(v) => update("dd_account_number", v)} />
                </div>
                <div>
                  <Label>Internal notes (optional)</Label>
                  <Textarea value={data.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-3 text-sm">
                <Row label="Company" value={data.name} />
                <Row label="Contact" value={`${data.primary_contact_name} · ${data.primary_contact_email}`} />
                <Row label="Address" value={`${data.address_line1}, ${data.city}, ${data.postcode}`} />
                <Row label="Subscription" value={`${selectedTier.label} · ${formatGBP(selectedTier.price)}/mo (monthly rolling)`} />
                <Row label="Start date" value={data.start_date} />
                <Row label="Admin login" value={`${data.admin_name} (${data.admin_email})`} />
                <Row label="Direct debit" value={data.dd_account_holder ? `${data.dd_account_holder} · ****${data.dd_account_number.slice(-4)} (mock)` : "Not set up"} />
                {variant === "sales" && (
                  <Row label="Signed up by" value={salesperson?.full_name || "—"} />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={next}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={loading} size="lg">
              {loading ? "Signing up…" : "Confirm & sign up client"}
            </Button>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 py-2 border-b last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default NewClientWizard;
