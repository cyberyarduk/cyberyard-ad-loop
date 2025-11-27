import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-dark.png";
import deviceMockup from "@/assets/device-mockup.jpg";
import playlistMockup from "@/assets/playlist-mockup.jpg";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";
import { Monitor, Video, Zap, ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };

    checkAuth();
  }, [navigate]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mailto link as no backend changes requested
    window.location.href = `mailto:info@cyberyard.com?subject=Contact from ${contactForm.name}&body=${encodeURIComponent(contactForm.message + "\n\nFrom: " + contactForm.email)}`;
    toast.success("Opening your email client...");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src={logo} alt="Cyberyard" className="h-10" />
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("home")} className="text-sm hover:text-primary transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection("about")} className="text-sm hover:text-primary transition-colors">
              About
            </button>
            <button onClick={() => scrollToSection("contact")} className="text-sm hover:text-primary transition-colors">
              Contact
            </button>
            <Link to="/auth">
              <Button size="sm">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-yellow-dark to-primary bg-clip-text text-transparent">
              Wearable Digital Billboards
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your staff into moving advertisements with Cyberyard's innovative wearable screen platform
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("about")} className="text-lg px-8">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-card py-20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">About Cyberyard</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Cyberyard provides a cutting-edge wearable digital advertising platform that turns your staff into dynamic, mobile billboards. 
                Our system uses Android devices worn on lanyards to display engaging video content, creating unprecedented advertising opportunities in retail, hospitality, and events.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="bg-background p-6 rounded-lg border border-border h-full">
                  <Monitor className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Wearable Screens</h3>
                  <p className="text-muted-foreground">
                    Staff wear Android devices on lanyards displaying your content wherever they go
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-background p-6 rounded-lg border border-border h-full">
                  <Video className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Video Playlists</h3>
                  <p className="text-muted-foreground">
                    Create and manage playlists that loop continuously in portrait format
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-background p-6 rounded-lg border border-border h-full">
                  <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
                  <p className="text-muted-foreground">
                    Generate quick offer videos instantly with AI - right from the device
                  </p>
                </div>
              </div>
            </div>

            {/* Mockup Images */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={deviceMockup} alt="Device in use" className="w-full h-64 object-cover" />
                <div className="p-4 bg-background">
                  <h4 className="font-semibold mb-1">Wearable Device</h4>
                  <p className="text-sm text-muted-foreground">Staff wear devices on lanyards</p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={playlistMockup} alt="Playlist management" className="w-full h-64 object-cover" />
                <div className="p-4 bg-background">
                  <h4 className="font-semibold mb-1">Playlist Manager</h4>
                  <p className="text-sm text-muted-foreground">Easy video content management</p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={dashboardMockup} alt="Admin dashboard" className="w-full h-64 object-cover" />
                <div className="p-4 bg-background">
                  <h4 className="font-semibold mb-1">Admin Dashboard</h4>
                  <p className="text-sm text-muted-foreground">Full control and analytics</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
            
            <div className="space-y-12">
              <div className="flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Create Your Content</h3>
                  <p className="text-muted-foreground text-lg">
                    Upload videos or use our AI-powered video generator to create stunning promotional content in seconds. 
                    All content is optimized for vertical portrait display.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Assign to Devices</h3>
                  <p className="text-muted-foreground text-lg">
                    Organize videos into playlists and push them to specific devices or all devices at once. 
                    Changes take effect immediately - no device restart needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Start Advertising</h3>
                  <p className="text-muted-foreground text-lg">
                    Staff wear the devices on lanyards as they work. Videos loop continuously in fullscreen kiosk mode, 
                    turning your team into mobile billboards that capture customer attention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-card py-20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-4">Contact Us</h2>
                <p className="text-muted-foreground text-lg">
                  Interested in transforming your staff into mobile billboards? Get in touch with our team.
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    placeholder="Tell us about your needs..."
                    rows={5}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Cyberyard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
