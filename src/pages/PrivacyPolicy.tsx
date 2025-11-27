import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const PrivacyPolicy = () => {
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
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {today}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <p>
            Cyberyard Limited ("Cyberyard", "we", "us", or "our") provides a digital advertising software platform and mobile player application used by businesses to display promotional content on wearable devices.
          </p>
          <p>
            We are committed to protecting your privacy and complying with the UK General Data Protection Regulation (GDPR).
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect the following categories of data:</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Account Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Business name</li>
                  <li>Business address</li>
                  <li>Contact phone number</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Device Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device ID</li>
                  <li>Device name</li>
                  <li>Pairing codes</li>
                  <li>Auth tokens</li>
                  <li>Battery level (if enabled)</li>
                  <li>Last connection time</li>
                  <li>Device model and OS version</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Usage Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Playlist refreshes</li>
                  <li>Video uploads</li>
                  <li>AI-generated video usage</li>
                  <li>Admin mode access events</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Media Content</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Uploaded images/videos</li>
                  <li>AI-generated videos</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Technical Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>IP address</li>
                  <li>Browser type</li>
                  <li>Login timestamps</li>
                  <li>Error logs</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use your data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and operate the Cyberyard platform</li>
              <li>Authenticate devices and accounts</li>
              <li>Deliver video content to your devices</li>
              <li>Process AI video creation requests</li>
              <li>Send service updates and support information</li>
              <li>Improve system performance and reliability</li>
              <li>Maintain security and prevent fraud</li>
            </ul>
            <p className="mt-4 font-semibold">We do not sell personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Legal Basis for Processing</h2>
            <p className="mb-4">We process personal data on the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contractual necessity</strong> – to provide the Cyberyard service</li>
              <li><strong>Legitimate interest</strong> – analytics, security, fraud prevention</li>
              <li><strong>Consent</strong> – where applicable (e.g., marketing emails)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
            <p className="mb-4">We may share information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cloud hosting providers</li>
              <li>Payment processors</li>
              <li>Customer support platforms</li>
              <li>Legal authorities (only if required)</li>
            </ul>
            <p className="mt-4">All third parties are GDPR-compliant and operate under data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p>
              We retain data for as long as your business account is active.
              Upon cancellation, we keep data for up to 12 months for legal, tax, and auditing requirements, then securely delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your data</li>
              <li>Correct your data</li>
              <li>Request deletion</li>
              <li>Restrict processing</li>
              <li>Transfer your data</li>
              <li>Object to processing</li>
            </ul>
            <p className="mt-4">To exercise rights, email: <a href="mailto:privacy@cyberyard.co.uk" className="text-primary hover:underline">privacy@cyberyard.co.uk</a></p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
            <p className="mb-4">We use:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted data storage</li>
              <li>Secure device authentication</li>
              <li>Strict company-level isolation</li>
              <li>Access control</li>
              <li>Regular audits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p>
              <strong>Cyberyard Limited</strong><br />
              Registered in England and Wales<br />
              Email: <a href="mailto:privacy@cyberyard.co.uk" className="text-primary hover:underline">privacy@cyberyard.co.uk</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
