import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  Monitor,
  Zap,
  Mail,
  Coffee,
  ShoppingBag,
  Dumbbell,
  Car,
  Wine,
  Calendar,
  Eye,
  Smartphone,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import logo from "@/assets/logo.png";
import AnimatedMeshGradient from "@/components/wow/AnimatedMeshGradient";
import FloatingDevice3D from "@/components/wow/FloatingDevice3D";
import ScrollReveal from "@/components/wow/ScrollReveal";

const stats = [
  { value: "92%", label: "Of shoppers notice moving, wearable displays in the first 5 seconds" },
  { value: "3×", label: "More views compared to static posters or screens" },
  { value: "Instant", label: "Push new promotions to every staff device in seconds" },
  { value: "Zero", label: "Training required — staff just put it on and go" },
];

const features = [
  {
    icon: Monitor,
    title: "Wearable Displays",
    desc: "Turn staff movement into marketing impact.",
    body: "Every step becomes a touchpoint. Every interaction becomes a promotion.",
    accent: "from-brand-yellow to-brand-pink",
  },
  {
    icon: Clock,
    title: "Instant Content Management",
    desc: "Update promotions across all devices in seconds.",
    body: "No printing. No screens. No delays.",
    accent: "from-brand-pink to-brand-purple",
  },
  {
    icon: Zap,
    title: "AI-Powered Creation",
    desc: "Snap a photo, generate a video instantly.",
    body: "Create on the shop floor — right on the device.",
    accent: "from-brand-purple to-brand-cyan",
  },
  {
    icon: Smartphone,
    title: "Smart Device Dashboard",
    desc: "Monitor devices, batteries, playlists, and content.",
    body: "Full control, total oversight.",
    accent: "from-brand-cyan to-brand-yellow",
  },
];

const useCases = [
  { icon: Coffee, title: "Cafés & Bakeries", body: "Promote fresh pastries, lunch deals, or end-of-day reductions." },
  { icon: ShoppingBag, title: "Retail Stores", body: "Highlight offers, new arrivals, or flash sales as staff move through the store." },
  { icon: Dumbbell, title: "Gyms & Leisure", body: "Upsell memberships, classes, and supplements." },
  { icon: Car, title: "Car Dealerships", body: "Show finance deals, service plans, and promotions on the showroom floor." },
  { icon: Wine, title: "Bars & Restaurants", body: "Promote cocktails, happy hour, and specials." },
  { icon: Calendar, title: "Events & Conferences", body: "Display schedules, sponsors, and announcements on event staff." },
];

const trustedBy = [
  { icon: ShoppingBag, label: "Retail" },
  { icon: Coffee, label: "Hospitality" },
  { icon: Car, label: "Automotive" },
  { icon: Dumbbell, label: "Gyms" },
  { icon: Wine, label: "Food & Beverage" },
  { icon: Calendar, label: "Events" },
];

const Index = () => {
  return (
    <div className="wow min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-strong border-b border-white/5">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Cyberyard" className="h-10 md:h-14 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[
                { href: "#about", label: "About" },
                { href: "#how-it-works", label: "How It Works" },
                { href: "#use-cases", label: "Use Cases" },
                { href: "#contact", label: "Contact" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/auth">
                <Button
                  size="sm"
                  className="bg-gradient-wow text-primary-foreground border-0 hover:opacity-90 transition-opacity font-semibold"
                >
                  Login
                </Button>
              </Link>
            </div>
            <Link to="/auth" className="md:hidden">
              <Button size="sm" className="bg-gradient-wow text-primary-foreground border-0 font-semibold">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-24 px-6 overflow-hidden">
        <AnimatedMeshGradient />
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background pointer-events-none" />

        <div className="relative container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
            <div className="text-center lg:text-left">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-8">
                  <Sparkles className="h-3.5 w-3.5 text-brand-yellow" />
                  <span className="text-xs font-medium tracking-wide text-foreground/90">
                    The future of in-store advertising
                  </span>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
                  Worn by your team.
                  <br />
                  <span className="text-gradient-wow animate-gradient-shift" style={{ backgroundSize: "200% 200%" }}>
                    Impossible to ignore.
                  </span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 font-light">
                  When your staff move, your promotions move with them.
                  Live, dynamic, and built for retail.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="text-base h-14 px-8 bg-gradient-wow text-primary-foreground border-0 hover:opacity-90 font-semibold glow-yellow group"
                  >
                    Book a Demo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base h-14 px-8 glass border-white/15 hover:bg-white/10 hover:text-foreground font-medium"
                  >
                    Watch It In Action
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            {/* 3D device */}
            <ScrollReveal variant="scale" delay={300}>
              <div className="relative h-[420px] md:h-[520px] lg:h-[600px]">
                <div className="absolute inset-0 bg-gradient-cool opacity-30 blur-3xl rounded-full" />
                <FloatingDevice3D />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 80}>
                <div className="glass rounded-2xl p-6 md:p-8 text-center hover-lift hover:border-white/20 h-full">
                  <div className="text-4xl md:text-5xl font-bold text-gradient-wow mb-3">
                    {s.value}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{s.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative py-28 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                Wearable digital signage,
                <br />
                <span className="text-gradient-wow">built for real-world retail.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Cyberyard combines lightweight wearable displays with a powerful cloud
                dashboard, enabling real-time promotions that meet customers right where
                they are — on the shop floor.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal>
            <div className="relative rounded-3xl p-1 bg-gradient-wow">
              <div className="rounded-[calc(1.5rem-4px)] bg-card/95 p-10 md:p-14">
                <h3 className="text-2xl md:text-3xl font-bold mb-10 text-center">Imagine:</h3>
                <div className="grid md:grid-cols-3 gap-10 text-center">
                  {[
                    { icon: Coffee, text: "A barista promoting the pastry of the day", color: "text-brand-yellow" },
                    { icon: ShoppingBag, text: "A sales advisor showcasing the weekend offer", color: "text-brand-pink" },
                    { icon: Eye, text: "A staff member triggering interest just by walking past", color: "text-brand-purple" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.text} className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl glass flex items-center justify-center">
                          <Icon className={`h-8 w-8 ${item.color}`} />
                        </div>
                        <p className="text-base md:text-lg text-foreground/90">{item.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-50 pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Everything you need to <span className="text-gradient-wow">go live</span>.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-lg text-muted-foreground">
                A full platform for wearable signage — designed for marketing teams.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={feature.title} delay={i * 100}>
                  <div className="group relative h-full">
                    {/* glow halo on hover */}
                    <div
                      className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-60 blur transition-opacity duration-500`}
                    />
                    <div className="relative h-full glass rounded-3xl p-8 hover-lift">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-6 shadow-lg`}
                      >
                        <Icon className="h-7 w-7 text-background" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-base text-foreground/90 mb-3">{feature.desc}</p>
                      <p className="text-sm text-muted-foreground">{feature.body}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Live in <span className="text-gradient-wow">three steps</span>.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-lg text-muted-foreground">
                From unboxing to live promotions in minutes.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", title: "Pair Your Devices", body: "Scan a QR code. Wearable displays connect to your business instantly." },
              { n: "02", title: "Create or Upload Content", body: "Upload videos or generate offer videos in seconds." },
              { n: "03", title: "Go Live Instantly", body: "Assign a playlist and watch promotions update across the floor in real time." },
            ].map((step, i) => (
              <ScrollReveal key={step.n} delay={i * 120}>
                <div className="relative h-full glass rounded-3xl p-8 hover-lift">
                  <div className="text-7xl font-bold text-gradient-wow mb-6 leading-none">
                    {step.n}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="relative py-28 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Where Cyberyard <span className="text-gradient-wow">works</span>.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-lg text-muted-foreground">
                Real examples across real industries.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <ScrollReveal key={uc.title} delay={i * 80}>
                  <div className="group relative h-full glass rounded-3xl p-7 hover-lift hover:border-white/20 transition-colors">
                    <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-5 group-hover:bg-gradient-wow transition-all">
                      <Icon className="h-7 w-7 text-brand-yellow group-hover:text-background transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{uc.title}</h3>
                    <p className="text-muted-foreground">{uc.body}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section className="relative py-28 px-6 overflow-hidden">
        <AnimatedMeshGradient className="opacity-50" />
        <div className="container mx-auto max-w-4xl relative">
          <div className="text-center mb-12">
            <ScrollReveal>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Why it <span className="text-gradient-wow">works</span>.
              </h2>
            </ScrollReveal>
          </div>

          <ScrollReveal>
            <div className="glass-strong rounded-3xl p-10 md:p-14 space-y-10">
              {[
                { icon: Eye, title: "People notice movement.", body: "Our brains are hardwired to detect motion — it's a survival instinct." },
                { icon: TrendingUp, title: "People follow other people's attention.", body: "If your staff are engaging with something, customers notice — and follow." },
                { icon: Monitor, title: "People trust staff more than signs.", body: "A screen on a person feels personal, credible, and human." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-wow flex items-center justify-center glow-purple">
                      <Icon className="h-6 w-6 text-background" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-base md:text-lg">{item.body}</p>
                    </div>
                  </div>
                );
              })}
              <p className="text-center text-lg md:text-xl font-semibold pt-8 border-t border-white/10">
                Cyberyard leverages human presence — not static screens — to make
                promotions{" "}
                <span className="text-gradient-wow">impossible to ignore</span>.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative py-28 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Loved by <span className="text-gradient-wow">retail teams</span>.
              </h2>
            </ScrollReveal>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Our pastry sales doubled in the first week.", name: "Laura", role: "Bakery Manager", icon: Coffee },
              { quote: "Customers stop staff to ask about offers — it works.", name: "Ben", role: "Retail Store Owner", icon: ShoppingBag },
              { quote: "The AI creator saved us hours. So easy.", name: "Jade", role: "Café Owner", icon: Coffee },
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <ScrollReveal key={t.name} delay={i * 100}>
                  <div className="glass rounded-3xl p-8 h-full hover-lift">
                    <div className="text-5xl font-bold text-gradient-wow leading-none mb-4">"</div>
                    <p className="text-lg mb-6 text-foreground/95">{t.quote}</p>
                    <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                      <div className="w-11 h-11 rounded-xl bg-gradient-wow flex items-center justify-center">
                        <Icon className="h-5 w-5 text-background" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUSTED BY — marquee */}
      <section className="relative py-16 px-6 border-y border-white/5 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-sm uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Trusted across industries
          </p>
          <div className="relative overflow-hidden">
            <div className="flex gap-12 animate-marquee whitespace-nowrap">
              {[...trustedBy, ...trustedBy].map((t, i) => {
                const Icon = t.icon;
                return (
                  <div
                    key={`${t.label}-${i}`}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="h-5 w-5 text-brand-yellow" />
                    <span className="font-medium text-lg">{t.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-pink/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="container mx-auto max-w-2xl relative">
          <div className="text-center mb-12">
            <ScrollReveal variant="scale">
              <div className="w-16 h-16 rounded-2xl bg-gradient-wow flex items-center justify-center mx-auto mb-6 glow-pink">
                <Mail className="h-8 w-8 text-background" />
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Get in <span className="text-gradient-wow">touch</span>.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="text-lg text-muted-foreground">
                Ready to transform your retail advertising? Let's talk.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={250}>
            <Card className="glass-strong border-white/10 rounded-3xl">
              <CardContent className="pt-6">
                <form className="space-y-5">
                  <Input placeholder="Your Name" className="h-12 bg-background/40 border-white/10" />
                  <Input type="email" placeholder="Email Address" className="h-12 bg-background/40 border-white/10" />
                  <Input placeholder="Company Name" className="h-12 bg-background/40 border-white/10" />
                  <Textarea placeholder="Tell us about your needs" className="min-h-[120px] bg-background/40 border-white/10" />
                  <Button className="w-full h-12 text-base bg-gradient-wow text-primary-foreground border-0 hover:opacity-90 font-semibold glow-yellow">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-14 px-6 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            <div>
              <img src={logo} alt="Cyberyard" className="h-12 mb-4" />
              <p className="text-sm text-muted-foreground max-w-xs">
                Wearable digital signage for modern retail. Worn by your team.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Company</h3>
                <div className="space-y-2">
                  <a href="#about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
                  <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
                  <a href="#contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Legal</h3>
                <div className="space-y-2">
                  <Link to="/privacy-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                  <Link to="/terms-of-service" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                  <Link to="/cookies-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Cookies Policy</Link>
                  <Link to="/refund-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Resources</h3>
                <div className="space-y-2">
                  <Link to="/data-processing-addendum" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Data Processing</Link>
                  <Link to="/acceptable-use-policy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Acceptable Use</Link>
                  <Link to="/auth" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-10 pt-8 border-t border-white/5 text-sm text-muted-foreground">
            <p>© 2024 Cyberyard Limited. Registered in England and Wales. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
