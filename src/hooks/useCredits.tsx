import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const VIDEO_GENERATION_COST = 2;

interface CreditsState {
  monthlyCredits: number;
  purchasedCredits: number;
  total: number;
  monthlyResetAt: string | null;
  loading: boolean;
}

export function useCredits() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [state, setState] = useState<CreditsState>({
    monthlyCredits: 0,
    purchasedCredits: 0,
    total: 0,
    monthlyResetAt: null,
    loading: true,
  });

  const fetchCredits = useCallback(async () => {
    if (!companyId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const { data, error } = await supabase
      .from("company_credits")
      .select("monthly_credits, purchased_credits, monthly_reset_at")
      .eq("company_id", companyId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching credits:", error);
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const monthly = data?.monthly_credits ?? 0;
    const purchased = data?.purchased_credits ?? 0;

    setState({
      monthlyCredits: monthly,
      purchasedCredits: purchased,
      total: monthly + purchased,
      monthlyResetAt: data?.monthly_reset_at ?? null,
      loading: false,
    });
  }, [companyId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  /** Attempts to deduct credits via secure DB function. Returns success + remaining. */
  const deductCredits = useCallback(
    async (amount: number, description = "Video generation") => {
      if (!companyId) {
        return { success: false, error: "No company associated with user" };
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc("deduct_credits", {
        _company_id: companyId,
        _amount: amount,
        _user_id: user?.id ?? null,
        _description: description,
      });

      if (error) {
        console.error("Error deducting credits:", error);
        return { success: false, error: error.message };
      }

      // Refresh local state
      await fetchCredits();

      const result = data as { success: boolean; error?: string; remaining?: number; available?: number };
      return result;
    },
    [companyId, fetchCredits]
  );

  return {
    ...state,
    refresh: fetchCredits,
    deductCredits,
    hasEnough: (amount: number) => state.total >= amount,
  };
}
