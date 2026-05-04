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
            <strong>Cyberyard Limited</strong> (Company No. <strong>15430744</strong>, registered in England &amp; Wales) uses cookies and similar technologies to operate, secure and improve our platform, in line with the UK GDPR and the Privacy and Electronic Communications Regulations (PECR).
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit our website. Similar technologies include local storage and pixels. They help us recognise your browser, remember your preferences, and measure performance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Categories of Cookies We Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Strictly necessary</strong> — required to sign you in, keep your session secure, and remember your cookie choice. These are always on.</li>
              <li><strong>Functional</strong> — remember preferences such as your selected dashboard view.</li>
              <li><strong>Analytics</strong> — help us understand how the platform is used so we can improve it. These are only set with your consent.</li>
            </ul>
            <p className="mt-4">
              We do not use advertising or cross-site tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Choices</h2>
            <p>
              On your first visit you'll see a cookie banner where you can <strong>Accept all</strong>, choose <strong>Essential only</strong>, or open <strong>Manage preferences</strong> to toggle each category individually.
            </p>
            <p className="mt-4">
              <Button
                onClick={() => window.openCookiePreferences?.()}
                className="rounded-full"
              >
                Manage cookie preferences
              </Button>
            </p>
            <p className="mt-4">
              You can also block or delete cookies via your browser settings. Note that disabling essential cookies may stop the platform from working.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Mobile App</h2>
            <p>
              Inside our native iOS and Android apps we don't use browser cookies, but we use equivalent local storage to keep you signed in and remember preferences. The same consent principles apply.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>
              Questions about cookies? Email <a href="mailto:privacy@cyberyard.co.uk" className="text-primary hover:underline">privacy@cyberyard.co.uk</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CookiesPolicy;
