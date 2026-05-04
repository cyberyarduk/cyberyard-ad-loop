import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Contact = () => {
  const [params] = useSearchParams();
  const initialSource = params.get("source") || "Website";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in your name, email and a short message.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Notify Jason (template has fixed `to`)
      const { error: notifyErr } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "contact-notification",
            templateData: { name, email, company, phone, message, source: initialSource },
          },
        }
      );
      if (notifyErr) throw notifyErr;

      // 2. Send confirmation to the visitor
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: email,
          templateData: { name: name.split(" ")[0] || name, message },
        },
      });

      setSent(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Sorry — we couldn't send your message. Please try again or email jason@cyberyard.co.uk.");
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

      <main className="container mx-auto px-6 py-16 max-w-2xl">
        {sent ? (
          <div className="text-center py-12">
            <div className="inline-flex w-16 h-16 rounded-full bg-yellow-soft items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Thanks, we've got it.</h1>
            <p className="text-muted-foreground mb-8">
              A member of the Cyberyard team will be in touch shortly — usually within one working day.
            </p>
            <Link to="/">
              <Button className="rounded-full">Back to home</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-3">
              {initialSource === "Book a demo" ? "Book a demo" : "Get in touch"}
            </h1>
            <p className="text-muted-foreground mb-10">
              Tell us a little about your business and we'll be in touch to set up a tailored walkthrough.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">How can we help? *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                  placeholder="A few details about your shop, screens, or what you'd like to achieve..."
                />
              </div>

              <Button type="submit" disabled={submitting} size="lg" className="rounded-full">
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Sending..." : "Send message"}
              </Button>

              <p className="text-xs text-muted-foreground pt-2">
                By submitting, you agree to our{" "}
                <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Contact;
