import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-transparent.png";
import deviceMockup from "@/assets/device-mockup.jpg";
import playlistMockup from "@/assets/playlist-mockup.jpg";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";
import { Monitor, Video, Zap, ArrowRight, Mail, BarChart3, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-navy-darker flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-dark/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Navigation */}
      <header className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <img src={logo} alt="Cyberyard" className="h-16 md:h-20 animate-fade-in" />
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("home")} className="text-sm font-medium hover:text-primary transition-all hover:scale-105">
              Home
            </button>
            <button onClick={() => scrollToSection("about")} className="text-sm font-medium hover:text-primary transition-all hover:scale-105">
              About
            </button>
            <button onClick={() => scrollToSection("contact")} className="text-sm font-medium hover:text-primary transition-all hover:scale-105">
              Contact
            </button>
            <Link to="/auth">
              <Button size="sm" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="container mx-auto px-4 py-32 text-center relative z-10">
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-block px-6 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4 animate-scale-in">
              <span className="text-sm font-semibold text-primary">Revolutionary Digital Advertising</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black mb-8 bg-gradient-to-r from-primary via-yellow-dark to-primary bg-clip-text text-transparent animate-fade-in leading-tight">
              Wearable Digital<br />Billboards
            </h1>
            <p className="text-2xl text-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Transform your staff into <span className="text-primary font-semibold">moving advertisements</span> with Cyberyard's innovative wearable screen platform
            </p>
            <div className="flex gap-6 justify-center flex-wrap">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-10 py-7 shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all">
                  Get Started <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("about")} className="text-lg px-10 py-7 border-2 hover:bg-primary/5 hover:scale-105 transition-all">
                Learn More
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16 pt-12 border-t border-border/50">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Active Devices</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Display Time</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">10x</div>
                <div className="text-sm text-muted-foreground">ROI Increase</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-gradient-to-b from-card to-background py-32 border-y border-border/50 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">About Cyberyard</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Cyberyard provides a <span className="text-primary font-semibold">cutting-edge wearable digital advertising platform</span> that turns your staff into dynamic, mobile billboards. 
                Our system uses Android devices worn on lanyards to display engaging video content, creating unprecedented advertising opportunities in retail, hospitality, and events.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-background to-card p-8 rounded-2xl border border-border/50 h-full hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all hover:-translate-y-2">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Monitor className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Wearable Screens</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Staff wear Android devices on lanyards displaying your content wherever they go
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-background to-card p-8 rounded-2xl border border-border/50 h-full hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all hover:-translate-y-2">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Video className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Video Playlists</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Create and manage playlists that loop continuously in portrait format
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-background to-card p-8 rounded-2xl border border-border/50 h-full hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all hover:-translate-y-2">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">AI-Powered</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Generate quick offer videos instantly with AI - right from the device
                  </p>
                </div>
              </div>
            </div>

            {/* Mockup Images */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all group">
                <div className="relative overflow-hidden">
                  <img src={deviceMockup} alt="Device in use" className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
                <div className="p-6 bg-gradient-to-br from-background to-card">
                  <h4 className="text-lg font-bold mb-2">Wearable Device</h4>
                  <p className="text-sm text-muted-foreground">Staff wear devices on lanyards</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all group">
                <div className="relative overflow-hidden">
                  <img src={playlistMockup} alt="Playlist management" className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
                <div className="p-6 bg-gradient-to-br from-background to-card">
                  <h4 className="text-lg font-bold mb-2">Playlist Manager</h4>
                  <p className="text-sm text-muted-foreground">Easy video content management</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all group">
                <div className="relative overflow-hidden">
                  <img src={dashboardMockup} alt="Admin dashboard" className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
                <div className="p-6 bg-gradient-to-br from-background to-card">
                  <h4 className="text-lg font-bold mb-2">Admin Dashboard</h4>
                  <p className="text-sm text-muted-foreground">Real-time analytics and insights</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">How It Works</h2>
              <p className="text-xl text-muted-foreground">Three simple steps to transform your staff into mobile billboards</p>
            </div>
            
            <div className="space-y-16">
              <div className="flex gap-8 items-start group">
                <div className="bg-gradient-to-br from-primary to-yellow-dark text-primary-foreground rounded-2xl w-16 h-16 flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">Create Your Content</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Upload videos or use our <span className="text-primary font-semibold">AI-powered video generator</span> to create stunning promotional content in seconds. 
                    All content is optimized for vertical portrait display with professional-grade output.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start group">
                <div className="bg-gradient-to-br from-primary to-yellow-dark text-primary-foreground rounded-2xl w-16 h-16 flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">Assign to Devices</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Organize videos into playlists and push them to specific devices or <span className="text-primary font-semibold">all devices at once</span>. 
                    Changes take effect immediately - no device restart needed. Full remote control from your dashboard.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 items-start group">
                <div className="bg-gradient-to-br from-primary to-yellow-dark text-primary-foreground rounded-2xl w-16 h-16 flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">Start Advertising</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Staff wear the devices on lanyards as they work. Videos loop continuously in <span className="text-primary font-semibold">fullscreen kiosk mode</span>, 
                    turning your team into mobile billboards that capture customer attention wherever they go.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-gradient-to-b from-card to-background py-32 border-y border-border/50 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16 space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Contact Us</h2>
                <p className="text-xl text-muted-foreground">
                  Ready to transform your staff into mobile billboards? Let's talk about how Cyberyard can revolutionize your advertising.
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-6 bg-background/50 backdrop-blur p-8 rounded-2xl border border-border/50 shadow-xl">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">Name</label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    placeholder="Your name"
                    className="h-12"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                    className="h-12"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold mb-2">Message</label>
                  <Textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    placeholder="Tell us about your needs..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30">
                  Send Message <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-12 bg-gradient-to-b from-background to-navy-darker relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Cyberyard" className="h-12" />
            </div>
            <p className="text-muted-foreground">&copy; 2025 Cyberyard. All rights reserved.</p>
            <div className="flex gap-6">
              <button onClick={() => scrollToSection("about")} className="text-sm text-muted-foreground hover:text-primary transition-colors">About</button>
              <button onClick={() => scrollToSection("contact")} className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</button>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
