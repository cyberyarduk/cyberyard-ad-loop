import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const CookiesPolicy = () => {
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
        <h1 className="text-4xl font-bold mb-4">Cookies Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {today}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <p>
            Cyberyard Limited uses cookies to improve your experience on our platform and ensure the proper functioning of our services.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit our website. They help us recognize you, remember your preferences, and improve our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="mb-4">Cyberyard uses cookies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Keep you logged in</li>
              <li>Improve dashboard performance</li>
              <li>Track error logs</li>
              <li>Analyse system usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p>
              You may disable cookies in your browser settings. However, please note that some features of the Cyberyard platform may not function correctly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>
              If you have questions about our use of cookies, please contact us at <a href="mailto:privacy@cyberyard.co.uk" className="text-primary hover:underline">privacy@cyberyard.co.uk</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CookiesPolicy;
