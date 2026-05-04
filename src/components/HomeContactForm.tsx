import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const HomeContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
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
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-notification",
          templateData: { name, email, company, message, source: "Homepage form" },
        },
      });
      if (error) throw error;

      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: email,
          templateData: { name: name.split(" ")[0] || name, message },
        },
      });

      setSent(true);
    } catch (err) {
      console.error(err);
      toast.error("Sorry — we couldn't send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-foreground" />
        <p className="font-semibold text-lg mb-2">Thanks, we've got it.</p>
        <p className="text-sm text-muted-foreground">We'll be in touch within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10"
      />
      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10"
      />
      <Input
        placeholder="Business name"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10"
      />
      <Textarea
        placeholder="Tell us about your shop"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        className="min-h-[100px] rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10 resize-none"
      />
      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-base group"
      >
        {submitting ? "Sending..." : "Send message"}
        <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </form>
  );
};

export default HomeContactForm;
