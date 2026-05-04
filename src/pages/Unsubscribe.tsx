import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "invalid" | "already" | "confirming" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setState("confirming");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (data.success || data.reason === "already_unsubscribed") setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Cyberyard" className="h-12" />
          </Link>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-6 py-16 max-w-md text-center">
        {state === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Checking your link...</p>
          </>
        )}

        {state === "valid" && (
          <>
            <h1 className="text-2xl font-bold mb-3">Unsubscribe</h1>
            <p className="text-muted-foreground mb-8">
              Click below to stop receiving emails from Cyberyard.
            </p>
            <Button onClick={confirm} size="lg" className="rounded-full">
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state === "confirming" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Updating your preferences...</p>
          </>
        )}

        {(state === "done" || state === "already") && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-foreground" />
            <h1 className="text-2xl font-bold mb-3">You're unsubscribed</h1>
            <p className="text-muted-foreground mb-8">
              You won't receive further marketing emails from Cyberyard.
            </p>
            <Link to="/">
              <Button variant="outline" className="rounded-full">Back to home</Button>
            </Link>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-3">Link invalid or expired</h1>
            <p className="text-muted-foreground mb-8">
              This unsubscribe link is no longer valid. Please email{" "}
              <a href="mailto:privacy@cyberyard.co.uk" className="underline">privacy@cyberyard.co.uk</a>{" "}
              for help.
            </p>
            <Link to="/">
              <Button variant="outline" className="rounded-full">Back to home</Button>
            </Link>
          </>
        )}
      </main>
    </div>
  );
};

export default Unsubscribe;
