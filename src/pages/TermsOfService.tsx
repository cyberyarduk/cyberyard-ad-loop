import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const TermsOfService = () => {
  const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

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
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {today}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <p>
            These Terms of Service ("Terms") form a legal agreement between you and <strong>Cyberyard Limited</strong>, a company registered in England &amp; Wales under company number <strong>15430744</strong> ("Cyberyard", "we", "us"). They govern your use of the Cyberyard web dashboard, mobile apps (iOS &amp; Android), device player software, and all related services ("Service").
          </p>
          <p className="font-semibold">
            By accessing or using Cyberyard, you confirm you have authority to bind your business and you agree to these Terms.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Services Provided</h2>
            <p className="mb-4">Cyberyard provides:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A digital advertising platform</li>
              <li>Device management and content delivery</li>
              <li>AI-assisted video creation tools</li>
              <li>Optional supply of compatible Android devices</li>
            </ul>
            <p className="mt-4">We may update or improve the Service at any time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accounts must be created by Cyberyard.</li>
              <li>You are responsible for safeguarding login credentials.</li>
              <li>You must ensure your staff use PIN-protected admin mode appropriately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Device Usage</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Devices must stay connected via WiFi or mobile data.</li>
              <li>You must not attempt to bypass device pairing or authentication.</li>
              <li>Lost or damaged devices remain your responsibility.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Content Rules</h2>
            <p className="mb-4">You may not upload:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Illegal content</li>
              <li>Copyrighted material without rights</li>
              <li>Offensive or harmful imagery</li>
              <li>Misleading or fraudulent claims</li>
            </ul>
            <p className="mt-4">We reserve the right to remove content that violates these rules.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Payments & Billing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed monthly or annually.</li>
              <li>Late or failed payments may result in service suspension.</li>
              <li>Hardware costs, if applicable, are non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cancellation</h2>
            <p>
              You may cancel at any time. Service continues until the end of the billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="mb-4">Cyberyard is not liable for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loss of business or revenue</li>
              <li>Device malfunction or battery performance</li>
              <li>Accuracy of AI-generated content</li>
            </ul>
            <p className="mt-4">Maximum liability is limited to one month of subscription fees.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Mobile App Stores</h2>
            <p>
              The Cyberyard apps may be distributed via the Apple App Store and Google Play. Your use of the apps is also subject to the applicable store's terms (Apple Media Services / Google Play Terms). Apple and Google are not responsible for the apps or any support, claims or warranties relating to them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of England &amp; Wales. The courts of England &amp; Wales have exclusive jurisdiction over any dispute arising from these Terms or your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Support &amp; Contact</h2>
            <p>
              <strong>Cyberyard Limited</strong> — Company No. 15430744, registered in England &amp; Wales.<br />
              Email support: <a href="mailto:support@cyberyard.co.uk" className="text-primary hover:underline">support@cyberyard.co.uk</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
