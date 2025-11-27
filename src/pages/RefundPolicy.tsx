import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const RefundPolicy = () => {
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
        <h1 className="text-4xl font-bold mb-4">Refund & Cancellation Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {today}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Subscription Fees</h2>
            <p>
              Subscription fees are <strong>non-refundable</strong> once the billing cycle has started.
            </p>
            <p>
              Your subscription will remain active until the end of the current billing period, even if you cancel during that period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Hardware</h2>
            <p>
              If hardware is supplied by Cyberyard, it is <strong>non-refundable</strong> unless defective on delivery.
            </p>
            <p>
              Defective hardware must be reported within 7 days of receipt. We will replace defective units at no additional cost.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cancellation</h2>
            <p>
              You may cancel your subscription at any time through your account settings or by contacting support.
            </p>
            <p>
              Service will continue until the end of the billing period. No prorated refunds are provided for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Service Suspension</h2>
            <p>
              If your account is suspended due to non-payment or violation of our Terms of Service, no refunds will be issued.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>
              For questions about refunds or cancellations, please contact <a href="mailto:support@cyberyard.co.uk" className="text-primary hover:underline">support@cyberyard.co.uk</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RefundPolicy;
