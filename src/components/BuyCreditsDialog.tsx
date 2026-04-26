import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BuyCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchased?: () => void;
}

const PACKS = [
  { id: "small", credits: 50, price: 19, label: "Starter" },
  { id: "medium", credits: 150, price: 49, label: "Popular", popular: true },
  { id: "large", credits: 500, price: 129, label: "Pro" },
];

export function BuyCreditsDialog({ open, onOpenChange, onPurchased }: BuyCreditsDialogProps) {
  const { profile } = useAuth();
  const [selectedPack, setSelectedPack] = useState<string>("medium");
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    const pack = PACKS.find((p) => p.id === selectedPack);
    if (!pack || !profile?.company_id) return;

    setProcessing(true);
    try {
      // NOTE: Payment integration not yet enabled.
      // For now, simulate the purchase by adding credits directly.
      // When Lovable Payments is enabled, replace this with a checkout flow.
      const { data: current, error: fetchError } = await supabase
        .from("company_credits")
        .select("purchased_credits")
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const newBalance = (current?.purchased_credits ?? 0) + pack.credits;

      const { error: updateError } = await supabase
        .from("company_credits")
        .update({ purchased_credits: newBalance })
        .eq("company_id", profile.company_id);

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("credit_transactions").insert({
        company_id: profile.company_id,
        user_id: user?.id ?? null,
        amount: pack.credits,
        transaction_type: "purchase",
        description: `Purchased ${pack.label} pack (${pack.credits} credits)`,
      });

      toast.success(`Added ${pack.credits} credits to your account!`);
      onPurchased?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Purchase error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add credits");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Buy More Credits
          </DialogTitle>
          <DialogDescription>
            Each video generation uses 2 credits. Purchased credits never expire.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {PACKS.map((pack) => {
            const selected = selectedPack === pack.id;
            return (
              <Card
                key={pack.id}
                onClick={() => setSelectedPack(pack.id)}
                className={`p-4 cursor-pointer transition-all ${
                  selected
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {pack.credits} credits
                        {pack.popular && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pack.label} pack · {Math.floor(pack.credits / 2)} videos
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">£{pack.price}</div>
                </div>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Purchase"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
