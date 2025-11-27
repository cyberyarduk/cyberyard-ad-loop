import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const DataProcessingAddendum = () => {
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
        <h1 className="text-4xl font-bold mb-4">Data Processing Addendum (DPA)</h1>
        <p className="text-muted-foreground mb-8">Last updated: {today}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <p>
            This Data Processing Addendum (DPA) is for business clients who require it under GDPR requirements.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Roles and Responsibilities</h2>
            <p>
              Cyberyard acts as a <strong>Data Processor</strong> for content uploaded by your business.
            </p>
            <p>
              Your business acts as the <strong>Data Controller</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Commitments</h2>
            <p className="mb-4">We will:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only process data according to your instructions</li>
              <li>Maintain confidentiality</li>
              <li>Securely store and transmit data</li>
              <li>Assist with GDPR requests</li>
              <li>Notify you of any data breach within 72 hours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Subprocessors</h2>
            <p className="mb-4">Subprocessors used include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Hosting provider (e.g., Vercel/Supabase)</li>
              <li>Payment processor</li>
              <li>Email & notification services</li>
            </ul>
            <p className="mt-4">
              All subprocessors are GDPR-compliant and bound by data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including encryption, access controls, and regular security audits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Subject Rights</h2>
            <p>
              We will assist you in responding to data subject requests, including requests for access, rectification, erasure, restriction, portability, and objection.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>
              For DPA-related inquiries, please contact <a href="mailto:privacy@cyberyard.co.uk" className="text-primary hover:underline">privacy@cyberyard.co.uk</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DataProcessingAddendum;
