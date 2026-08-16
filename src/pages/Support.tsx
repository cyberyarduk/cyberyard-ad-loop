import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, LifeBuoy, Trash2, ShieldCheck, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

const Support = () => {
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

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Support</h1>
        <p className="text-muted-foreground mb-10">
          Help with the Cyberyard app, your account, devices and billing.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="rounded-2xl border p-6">
            <Mail className="h-5 w-5 mb-3" />
            <h2 className="font-semibold mb-1">Email support</h2>
            <p className="text-sm text-muted-foreground mb-3">
              The fastest way to reach a human.
            </p>
            <a href="mailto:jason@cyberyard.co.uk" className="text-primary hover:underline text-sm">
              jason@cyberyard.co.uk
            </a>
          </div>
          <div className="rounded-2xl border p-6">
            <Clock className="h-5 w-5 mb-3" />
            <h2 className="font-semibold mb-1">Response times</h2>
            <p className="text-sm text-muted-foreground">
              We reply within one working day, Monday to Friday, 9am–5pm UK time.
            </p>
          </div>
          <div className="rounded-2xl border p-6">
            <LifeBuoy className="h-5 w-5 mb-3" />
            <h2 className="font-semibold mb-1">Send us a message</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Use the contact form and we'll pick it up straight away.
            </p>
            <Link to="/contact" className="text-primary hover:underline text-sm">Contact form</Link>
          </div>
          <div className="rounded-2xl border p-6">
            <Trash2 className="h-5 w-5 mb-3" />
            <h2 className="font-semibold mb-1">Delete your account</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Request permanent deletion of your account and data.
            </p>
            <Link to="/delete-account" className="text-primary hover:underline text-sm">Delete account</Link>
          </div>
        </div>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Common questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-1">How do I get an account?</h3>
                <p className="text-sm text-muted-foreground">
                  Cyberyard is a business (B2B) product and accounts are created for you by our team.
                  There is no public sign-up. Email us and we'll set your business up and send your
                  login details.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">How do I pair a screen?</h3>
                <p className="text-sm text-muted-foreground">
                  Open the app on the screen you want to use, choose Media Player, and enter the
                  pairing code shown in your dashboard under Devices.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">My video won't play automatically</h3>
                <p className="text-sm text-muted-foreground">
                  Some devices require a single tap before video can start. Tap the screen once and
                  playback will loop continuously after that.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">How do I exit the media player?</h3>
                <p className="text-sm text-muted-foreground">
                  Tap the logo four times on the pairing screen, or use the bottom navigation bar to
                  switch back to the portal.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Billing and cancellation</h3>
                <p className="text-sm text-muted-foreground">
                  Subscriptions are monthly rolling. You can cancel any time and the service runs to
                  the end of the paid period. See our{" "}
                  <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-6">
            <ShieldCheck className="h-5 w-5 mb-3" />
            <h2 className="font-semibold mb-2">Privacy &amp; legal</h2>
            <p className="text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
              {" · "}
              <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service (EULA)</Link>
              {" · "}
              <Link to="/acceptable-use-policy" className="text-primary hover:underline">Acceptable Use</Link>
              {" · "}
              <Link to="/cookies-policy" className="text-primary hover:underline">Cookies</Link>
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              <strong>Cyberyard Limited</strong> — Company No. 15430744, registered in England &amp; Wales.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Support;
