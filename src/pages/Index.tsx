import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Video, Monitor, Zap, Mail, Coffee, ShoppingBag, Dumbbell, Car, Wine, Calendar, Eye, Smartphone, TrendingUp, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
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
              <img src={logo} alt="Cyberyard" className="h-10 md:h-16 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                About
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#use-cases" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Use Cases
              </a>
              <a href="#contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <Link to="/auth">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            </div>
            <Link to="/auth" className="md:hidden">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - MASSIVE WOW */}
      <section className="pt-40 pb-24 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-tight">
            The Future of In-Store Advertising — Worn by Your Team.
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-6 font-light">
            When your staff move, your promotions move with them.
          </p>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-light">
            Live, dynamic, and impossible to ignore.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-10 py-7">
              Book a Demo
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-10 py-7">
              Watch It In Action
            </Button>
          </div>
          <p className="text-lg text-muted-foreground italic max-w-3xl mx-auto">
            "The world's first wearable digital signage platform built for retail engagement."
          </p>
        </div>
      </section>

      {/* Trust-Driving Stats */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">92%</div>
              <div className="text-sm text-muted-foreground">Of shoppers notice moving, wearable displays in the first 5 seconds</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">3× More</div>
              <div className="text-sm text-muted-foreground">Views compared to static posters or screens</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">Instant</div>
              <div className="text-sm text-muted-foreground">Push new promotions to every staff device in seconds</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">Zero</div>
              <div className="text-sm text-muted-foreground">Training required — staff just put it on and go</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - More Corporate */}
      <section id="about" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Wearable digital signage, built for real-world retail.</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Cyberyard transforms the way businesses communicate with customers. Our platform combines lightweight wearable displays with a powerful cloud dashboard, enabling real-time promotions that meet customers right where they are — on the shop floor.
            </p>
          </div>

          <div className="bg-muted/30 rounded-2xl p-12 mb-16">
            <h3 className="text-3xl font-bold mb-8 text-center">Imagine:</h3>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Coffee className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg">A barista promoting the pastry of the day</p>
              </div>
              <div>
                <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg">A sales advisor showcasing the weekend offer</p>
              </div>
              <div>
                <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg">A staff member triggering interest just by walking past</p>
              </div>
            </div>
          </div>

          <p className="text-2xl text-center font-semibold">
            Cyberyard makes in-store advertising dynamic, personal, and alive.
          </p>
        </div>
      </section>

      {/* Feature Sections - Benefit-Led */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Monitor className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Wearable Displays</CardTitle>
                <CardDescription className="text-lg">
                  Turn staff movement into marketing impact.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground">
                  Every step becomes a touchpoint. Every interaction becomes a promotion.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Instant Content Management</CardTitle>
                <CardDescription className="text-lg">
                  Update promotions across all devices in seconds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground">
                  No printing. No screens. No delays.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">AI-Powered Creation</CardTitle>
                <CardDescription className="text-lg">
                  Need a promo fast? Snap a photo and generate a video instantly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground">
                  Create on the shop floor — right on the device.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Smart Device Dashboard</CardTitle>
                <CardDescription className="text-lg">
                  Monitor devices, battery levels, playlists, and content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground">
                  Full control, total oversight.
                </p>
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

      {/* How It Works - Simple but Classy */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to transform your in-store advertising
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Pair Your Devices</h3>
                <p className="text-muted-foreground text-lg">
                  Scan a QR code. Your wearable displays instantly connect to your business.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Create or Upload Content</h3>
                <p className="text-muted-foreground text-lg">
                  Upload videos or create new offers using our AI video generator.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Go Live Instantly</h3>
                <p className="text-muted-foreground text-lg">
                  Assign a playlist and watch your promotions update across the shop floor in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases - MAJOR WOW */}
      <section id="use-cases" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Where Cyberyard Works</h2>
            <p className="text-lg text-muted-foreground">
              Real examples across real industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Coffee className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Cafés & Bakeries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Promote fresh pastries, lunch deals, or end-of-day reductions.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <ShoppingBag className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Retail Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Highlight offers, new arrivals, or flash sales as staff move through the store.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Dumbbell className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Gyms & Leisure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upsell memberships, classes, and supplements.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Car className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Car Dealerships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Show finance deals, service plans, and promotions on the showroom floor.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Wine className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Bars & Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Promote cocktails, happy hour, and specials.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Events & Conferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Display schedules, sponsors, and announcements on event staff.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why It Works - Science-Backed */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6">Why It Works</h2>
          </div>

          <div className="bg-muted/30 rounded-2xl p-12 space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">People notice movement.</h3>
                <p className="text-muted-foreground">
                  Our brains are hardwired to detect motion — it's a survival instinct.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">People follow other people's attention.</h3>
                <p className="text-muted-foreground">
                  If your staff are engaging with something, customers notice — and follow.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">People trust staff more than signs.</h3>
                <p className="text-muted-foreground">
                  A screen on a person feels personal, credible, and human.
                </p>
              </div>
            </div>

            <p className="text-center text-lg font-semibold pt-6 border-t border-border">
              Cyberyard leverages human presence — not static screens — to make promotions impossible to ignore.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <p className="text-lg mb-6 italic">
                  "Our pastry sales doubled in the first week."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Laura</p>
                    <p className="text-sm text-muted-foreground">Bakery Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <p className="text-lg mb-6 italic">
                  "Customers stop staff to ask about offers — it works."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Ben</p>
                    <p className="text-sm text-muted-foreground">Retail Store Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <p className="text-lg mb-6 italic">
                  "The AI creator saved us hours. So easy."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Jade</p>
                    <p className="text-sm text-muted-foreground">Café Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">Trusted By</h3>
            <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <span className="font-medium">Retail</span>
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                <span className="font-medium">Hospitality</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                <span className="font-medium">Automotive</span>
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                <span className="font-medium">Gyms</span>
              </div>
              <div className="flex items-center gap-2">
                <Wine className="h-5 w-5" />
                <span className="font-medium">Food & Beverage</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Events</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-muted/30">
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
      <footer className="py-12 px-6 border-t border-border bg-background">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Cyberyard" className="h-12" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Company</h3>
                <div className="space-y-2">
                  <a href="#about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </a>
                  <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </a>
                  <a href="#contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Legal</h3>
                <div className="space-y-2">
                  <Link to="/privacy-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                  <Link to="/terms-of-service" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                  <Link to="/cookies-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cookies Policy
                  </Link>
                  <Link to="/refund-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Refund Policy
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Resources</h3>
                <div className="space-y-2">
                  <Link to="/data-processing-addendum" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Data Processing
                  </Link>
                  <Link to="/acceptable-use-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Acceptable Use
                  </Link>
                  <Link to="/auth" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
            <p>© 2024 Cyberyard Limited. Registered in England and Wales. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
