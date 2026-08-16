import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const DeleteAccount = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please give us your name and the email on the account.");
      return;
    }
    setSubmitting(true);
    try {
      const message =
        `ACCOUNT DELETION REQUEST\n\nAccount email: ${email}\nBusiness: ${company || "not given"}\n\nReason: ${reason || "not given"}`;
      const { error } = await supabase.from("contact_messages").insert({
        name,
        email,
        company: company || null,
        message,
        source: "Account deletion request",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;

      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "contact-notification",
            templateData: { name, email, company, message, source: "Account deletion request" },
          },
        })
        .catch((err) => console.error("notification email failed", err));

      setSent(true);
    } catch (err) {
      console.error(err);
      toast.error("Sorry — we couldn't submit your request. Please email jason@cyberyard.co.uk.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Cyberyard" className="h-12" />
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Delete your account</h1>
        <p className="text-muted-foreground mb-8">
          You can ask us to permanently delete your Cyberyard account and the data linked to it at
          any time — from the app, this page, or by email.
        </p>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold">What gets deleted</h2>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Your login and profile (name, email, phone)</li>
            <li>Your business account, venues and paired devices</li>
            <li>Uploaded images and videos, AI-generated videos and playlists</li>
            <li>Usage and device activity records tied to your account</li>
          </ul>
          <h2 className="text-2xl font-semibold pt-4">What we keep, and for how long</h2>
          <p className="text-sm text-muted-foreground">
            We retain invoices and payment records for up to 6 years where UK tax and company law
            requires it. Everything else is deleted within 30 days of your request being verified.
          </p>
          <h2 className="text-2xl font-semibold pt-4">How it works</h2>
          <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Submit the form below (or email jason@cyberyard.co.uk from your account address).</li>
            <li>We verify the request with the account owner.</li>
            <li>Your account is closed and data deleted within 30 days. We confirm by email.</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Note: Cyberyard accounts belong to a business. If you are a team member, the account
            owner may need to confirm the deletion.
          </p>
        </section>

        {sent ? (
          <div className="rounded-2xl border p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-foreground" />
            <p className="font-semibold text-lg mb-2">Request received.</p>
            <p className="text-sm text-muted-foreground">
              We'll verify it and confirm deletion by email within 30 days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Request deletion</h2>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 rounded-xl"
            />
            <Input
              type="email"
              placeholder="Email on the account"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl"
            />
            <Input
              placeholder="Business name (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Textarea
              placeholder="Anything you'd like us to know (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="rounded-xl"
            />
            <Button type="submit" disabled={submitting} className="rounded-full w-full h-12">
              {submitting ? "Submitting…" : "Request account deletion"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Prefer email? Write to{" "}
              <a href="mailto:jason@cyberyard.co.uk" className="text-primary hover:underline">
                jason@cyberyard.co.uk
              </a>{" "}
              with the subject "Delete my account".
            </p>
          </form>
        )}
      </main>
    </div>
  );
};

export default DeleteAccount;
