import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Video, Monitor, Zap, Mail } from "lucide-react";
import logo from "@/assets/logo-transparent.png";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";
import deviceMockup from "@/assets/device-mockup.jpg";
import playlistMockup from "@/assets/playlist-mockup.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Cyberyard" className="h-10" />
            </Link>
            <div className="flex items-center gap-8">
              <a href="#about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                About
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <Link to="/auth">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6">
            Revolutionary Digital Advertising
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Transform your retail space with wearable digital billboards. Engage customers with dynamic content that drives results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8">
              Book a Demo
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-sm text-muted-foreground">Active Devices</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Display Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10x</div>
              <div className="text-sm text-muted-foreground">ROI Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">About Cyberyard</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The complete platform for managing wearable digital advertising displays
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Wearable Displays</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Staff wear digital displays that showcase promotional content directly to customers on the shop floor
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Video Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Upload and organize promotional videos. Create playlists and manage content across all devices
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Real-time analytics and insights. Full control over devices, venues, and content from one place
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-border">
              <img src={deviceMockup} alt="Device" className="w-full h-64 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-border">
              <img src={playlistMockup} alt="Playlist" className="w-full h-64 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-border">
              <img src={dashboardMockup} alt="Dashboard" className="w-full h-64 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Register Your Devices</h3>
                <p className="text-muted-foreground text-base">
                  Add your wearable display devices to the platform and pair them with a simple QR code scan
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Create Your Content</h3>
                <p className="text-muted-foreground text-base">
                  Upload promotional videos or use our AI-powered video creator to generate content in seconds
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Deploy and Monitor</h3>
                <p className="text-muted-foreground text-base">
                  Assign playlists to devices and track performance through your real-time analytics dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-5xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-muted-foreground">
              Ready to transform your retail advertising? Contact us today
            </p>
          </div>

          <Card className="border border-border shadow-sm">
            <CardContent className="pt-6">
              <form className="space-y-6">
                <div>
                  <Input
                    placeholder="Your Name"
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Company Name"
                    className="h-12"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Tell us about your needs"
                    className="min-h-[120px]"
                  />
                </div>
                <Button className="w-full h-12 text-base">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Cyberyard" className="h-8" />
            </div>
            <div className="flex gap-8">
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-muted-foreground">
            © 2024 Cyberyard. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
