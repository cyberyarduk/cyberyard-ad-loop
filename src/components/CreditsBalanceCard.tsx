import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle } from "lucide-react";
import { useCredits, VIDEO_GENERATION_COST } from "@/hooks/useCredits";
import { useState } from "react";
import { BuyCreditsDialog } from "@/components/BuyCreditsDialog";

interface CreditsBalanceCardProps {
  /** When true, shows a warning when balance is below the cost of one video. */
  highlightLow?: boolean;
}

export function CreditsBalanceCard({ highlightLow = false }: CreditsBalanceCardProps) {
  const { monthlyCredits, purchasedCredits, total, loading, refresh } = useCredits();
  const [buyOpen, setBuyOpen] = useState(false);

  const isLow = total < VIDEO_GENERATION_COST;
  const showWarning = highlightLow && isLow;

  return (
    <>
      <Card
        className={`p-4 ${
          showWarning ? "border-destructive/50 bg-destructive/5" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                showWarning ? "bg-destructive/10" : "bg-primary/10"
              }`}
            >
              {showWarning ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Available credits</div>
              <div className="text-2xl font-bold">
                {loading ? "—" : total}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {monthlyCredits} monthly · {purchasedCredits} purchased
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={showWarning ? "default" : "outline"}
            onClick={() => setBuyOpen(true)}
          >
            Buy Credits
          </Button>
        </div>
        {showWarning && (
          <p className="text-sm text-destructive mt-3">
            You don't have enough credits to generate a video. Each video costs{" "}
            {VIDEO_GENERATION_COST} credits.
          </p>
        )}
      </Card>

      <BuyCreditsDialog open={buyOpen} onOpenChange={setBuyOpen} onPurchased={refresh} />
    </>
  );
}
