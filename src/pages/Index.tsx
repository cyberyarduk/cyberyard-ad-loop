import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  ShoppingBag,
  Dumbbell,
  Car,
  Wine,
  Calendar,
  Monitor,
  Zap,
  Smartphone,
  Clock,
  Sparkles,
  Eye,
  TrendingUp,
  Check,
  Play,
  Battery,
  Wifi,
} from "lucide-react";
import logo from "@/assets/logo.png";
import Reveal from "@/components/premium/Reveal";

const stats = [
  { value: "92%", label: "Of shoppers notice wearable displays" },
  { value: "3×", label: "More views than static signage" },
  { value: "<2s", label: "To push promos to every device" },
  { value: "0", label: "Training required to use" },
];

const features = [
  {
    icon: Monitor,
    title: "Wearable displays",
    desc: "Turn staff movement into marketing impact. Every step a touchpoint.",
    tone: "yellow",
  },
  {
    icon: Clock,
    title: "Instant content updates",
    desc: "Push new promotions to every device in seconds. No printing, no delays.",
    tone: "lavender",
  },
  {
    icon: Zap,
    title: "AI-powered creation",
    desc: "Snap a photo, generate an offer video instantly — right on the shop floor.",
    tone: "peach",
  },
  {
    icon: Smartphone,
    title: "Smart dashboard",
    desc: "Monitor devices, batteries, playlists and content. Full control.",
    tone: "mint",
  },
] as const;

const useCases = [
  { icon: Coffee, title: "Cafés & Bakeries", body: "Promote fresh pastries, lunch deals or end-of-day reductions.", tone: "peach" },
  { icon: ShoppingBag, title: "Retail Stores", body: "Highlight offers, new arrivals or flash sales as staff move through the store.", tone: "lavender" },
  { icon: Dumbbell, title: "Gyms & Leisure", body: "Upsell memberships, classes and supplements.", tone: "mint" },
  { icon: Car, title: "Car Dealerships", body: "Show finance deals, service plans and promotions on the showroom floor.", tone: "sky" },
  { icon: Wine, title: "Bars & Restaurants", body: "Promote cocktails, happy hour and specials.", tone: "yellow" },
  { icon: Calendar, title: "Events & Conferences", body: "Display schedules, sponsors and announcements on event staff.", tone: "lavender" },
] as const;

const trustedBy = ["Retail", "Hospitality", "Automotive", "Gyms", "Food & Beverage", "Events", "Conferences", "Showrooms"];

const toneClasses: Record<string, { bg: string; text: string; ring: string }> = {
  yellow:   { bg: "bg-yellow-soft",   text: "text-foreground",      ring: "ring-yellow-bright/30" },
  lavender: { bg: "bg-lavender",      text: "text-lavender-deep",   ring: "ring-lavender-deep/30" },
  peach:    { bg: "bg-peach",         text: "text-peach-deep",      ring: "ring-peach-deep/30" },
  mint:     { bg: "bg-mint",          text: "text-mint-deep",       ring: "ring-mint-deep/30" },
  sky:      { bg: "bg-sky",           text: "text-sky-deep",        ring: "ring-sky-deep/30" },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-background/75 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Cyberyard" className="h-10 md:h-12 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[
                { href: "#features", label: "Features" },
                { href: "#how-it-works", label: "How it works" },
                { href: "#use-cases", label: "Use cases" },
                { href: "#contact", label: "Contact" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline"
                >
                  {l.label}
                </a>
              ))}
              <Link to="/auth">
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5 font-semibold h-9">
                  Login
                </Button>
              </Link>
            </div>
            <Link to="/auth" className="md:hidden">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-24 md:pb-32 px-6 overflow-hidden">
        {/* Pastel wash background */}
        <div className="absolute inset-0 bg-wash-warm opacity-90 pointer-events-none" />
        {/* Floating orbs */}
        <div className="absolute top-32 -left-20 w-96 h-96 orb bg-peach animate-float" />
        <div className="absolute top-20 right-0 w-80 h-80 orb bg-lavender animate-float-delay" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] orb bg-yellow-soft animate-float-slow opacity-60" />

        <div className="relative container mx-auto max-w-6xl">
          {/* Eyebrow */}
          <Reveal>
            <div className="flex justify-center mb-8">
              <div className="chip border border-border/60 bg-background/80 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-bright" />
                <span>The future of in-store advertising</span>
              </div>
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={100}>
            <h1 className="text-display-lg font-semibold text-center max-w-5xl mx-auto tracking-tight">
              Promotions that <span className="relative inline-block">
                <span className="relative z-10">walk the floor</span>
                <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-5 bg-yellow-bright/60 -z-0 rounded-sm" />
              </span>
              <br />
              with your team.
            </h1>
          </Reveal>

          {/* Sub */}
          <Reveal delay={200}>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
              Wearable displays + a powerful dashboard. Push live offers to your staff in
              seconds — and turn every customer interaction into a marketing moment.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                size="lg"
                className="h-13 px-7 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-base group shadow-lg shadow-foreground/20"
              >
                Book a demo
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-7 rounded-full bg-background/80 backdrop-blur border-border hover:bg-background font-medium text-base group"
              >
                <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                Watch in action
              </Button>
            </div>
          </Reveal>

          {/* Hero visual — floating UI cards */}
          <Reveal delay={400}>
            <div className="relative mt-20 md:mt-24 max-w-5xl mx-auto h-[380px] md:h-[460px]">
              {/* Center: device frame */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative w-44 md:w-56 aspect-[9/16] rounded-[2.5rem] bg-foreground p-2.5 shadow-2xl shadow-foreground/30">
                  <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-yellow-bright via-peach-deep to-lavender-deep relative overflow-hidden">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-foreground/80 mb-2">Today's Offer</p>
                      <p className="font-semibold text-2xl md:text-3xl text-foreground leading-tight">Buy 2 get 1<br />FREE</p>
                      <div className="mt-4 px-3 py-1 rounded-full bg-foreground text-background text-xs font-bold">
                        SAVE 33%
                      </div>
                    </div>
                  </div>
                  {/* notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-background/40" />
                </div>
              </div>

              {/* Floating card top-left: Devices online */}
              <div className="hidden md:block absolute left-0 top-8 z-10 animate-float">
                <div className="premium-card rounded-2xl p-4 w-56">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Devices live</p>
                    <span className="flex h-2 w-2 rounded-full bg-mint-deep animate-pulse" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight">24<span className="text-base font-medium text-muted-foreground">/24</span></p>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-6 flex-1 rounded-sm bg-mint-deep/80" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating card right: Push playlist */}
              <div className="hidden md:block absolute right-0 top-16 z-10 animate-float-delay">
                <div className="premium-card rounded-2xl p-4 w-60">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-soft flex items-center justify-center">
                      <Zap className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Playlist pushed</p>
                      <p className="text-xs text-muted-foreground">to all devices · 1.2s</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {["Weekend Sale", "New Arrivals", "Loyalty Offer"].map((p) => (
                      <div key={p} className="flex items-center gap-2 text-xs">
                        <Check className="h-3 w-3 text-mint-deep" strokeWidth={3} />
                        <span className="text-foreground/80">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating card bottom-left: Battery */}
              <div className="hidden md:block absolute left-12 bottom-4 z-10 animate-float-slow">
                <div className="premium-card rounded-2xl p-4 w-52">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center">
                      <Battery className="h-5 w-5 text-mint-deep" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg battery</p>
                      <p className="text-lg font-bold">87%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating card bottom-right: Connected */}
              <div className="hidden md:block absolute right-12 bottom-12 z-10 animate-float">
                <div className="premium-card rounded-2xl p-4 w-52">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky flex items-center justify-center">
                      <Wifi className="h-5 w-5 text-sky-deep" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Network</p>
                      <p className="text-sm font-semibold">All connected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUSTED BY MARQUEE */}
      <section className="relative py-10 border-y border-border/60 bg-background overflow-hidden">
        <div className="container mx-auto max-w-6xl mb-4">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Built for businesses across
          </p>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-16 animate-marquee-slow whitespace-nowrap">
            {[...trustedBy, ...trustedBy, ...trustedBy].map((t, i) => (
              <span key={i} className="text-2xl md:text-3xl font-semibold text-foreground/30 hover:text-foreground transition-colors flex items-center gap-16">
                {t}
                <span className="text-yellow-bright">●</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="chip mb-5">By the numbers</span>
              <h2 className="text-display-md font-semibold tracking-tight">
                Wearable signage actually <span className="text-foreground">works</span>.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="premium-card rounded-3xl p-7 md:p-8 hover-lift h-full">
                  <p className="text-5xl md:text-6xl font-bold tracking-tight">{s.value}</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-wash-cool opacity-60 pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative">
          <Reveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="chip mb-5">Features</span>
              <h2 className="text-display-md font-semibold tracking-tight">
                Everything you need to go <span className="relative inline-block">
                  <span className="relative z-10">live</span>
                  <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-yellow-bright/60 -z-0 rounded-sm" />
                </span>.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                A complete platform for wearable signage — designed for marketing teams.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              const tone = toneClasses[f.tone];
              return (
                <Reveal key={f.title} delay={i * 100}>
                  <div className="premium-card rounded-3xl p-7 md:p-8 hover-lift h-full">
                    <div className={`w-12 h-12 rounded-2xl ${tone.bg} flex items-center justify-center mb-5 ring-4 ${tone.ring}`}>
                      <Icon className="h-5 w-5 text-foreground" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight mb-2">{f.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="chip mb-5">How it works</span>
              <h2 className="text-display-md font-semibold tracking-tight">
                From box to live in <span className="text-foreground">three steps</span>.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              { n: "01", title: "Pair your devices", body: "Scan a QR code. Wearable displays connect instantly.", tone: "peach" },
              { n: "02", title: "Create or upload", body: "Upload videos or generate AI offer videos in seconds.", tone: "lavender" },
              { n: "03", title: "Push live", body: "Assign a playlist and watch promos update across the floor in real time.", tone: "yellow" },
            ].map((step, i) => {
              const tone = toneClasses[step.tone];
              return (
                <Reveal key={step.n} delay={i * 120}>
                  <div className={`relative ${tone.bg} rounded-3xl p-8 md:p-10 h-full overflow-hidden hover-lift`}>
                    <p className="text-7xl md:text-8xl font-bold tracking-tight text-foreground/10 mb-2">{step.n}</p>
                    <h3 className="text-2xl font-semibold tracking-tight mb-3">{step.title}</h3>
                    <p className="text-base text-foreground/75 leading-relaxed">{step.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-wash-warm opacity-50 pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative">
          <Reveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="chip mb-5">Use cases</span>
              <h2 className="text-display-md font-semibold tracking-tight">
                Made for places where <span className="text-foreground">people gather</span>.
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              const tone = toneClasses[uc.tone];
              return (
                <Reveal key={uc.title} delay={i * 70}>
                  <div className="premium-card rounded-3xl p-7 hover-lift h-full group cursor-pointer">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl ${tone.bg} flex items-center justify-center ring-4 ${tone.ring}`}>
                        <Icon className="h-5 w-5 text-foreground" strokeWidth={2} />
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight mb-2">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{uc.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="chip mb-5">Why it works</span>
              <h2 className="text-display-md font-semibold tracking-tight">
                The science of <span className="text-foreground">human attention</span>.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              { icon: Eye,         title: "Movement gets noticed", body: "Our brains are hardwired to detect motion — it's instinct.", tone: "yellow" },
              { icon: TrendingUp,  title: "People follow people",  body: "If your staff are engaged, customers notice — and follow.", tone: "lavender" },
              { icon: Monitor,     title: "Trust is personal",     body: "A screen on a person feels credible, human and real.", tone: "mint" },
            ].map((item, i) => {
              const Icon = item.icon;
              const tone = toneClasses[item.tone];
              return (
                <Reveal key={item.title} delay={i * 100}>
                  <div className="premium-card rounded-3xl p-8 hover-lift h-full">
                    <div className={`w-14 h-14 rounded-2xl ${tone.bg} flex items-center justify-center mb-6 ring-4 ${tone.ring}`}>
                      <Icon className="h-6 w-6 text-foreground" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight mb-2">{item.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{item.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="chip mb-5">Loved by retail teams</span>
              <h2 className="text-display-md font-semibold tracking-tight">
                Real results, fast.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              { quote: "Our pastry sales doubled in the first week.", name: "Laura", role: "Bakery Manager", icon: Coffee, tone: "peach" },
              { quote: "Customers stop staff to ask about offers — it works.", name: "Ben", role: "Retail Store Owner", icon: ShoppingBag, tone: "lavender" },
              { quote: "The AI creator saved us hours. So easy.", name: "Jade", role: "Café Owner", icon: Coffee, tone: "yellow" },
            ].map((t, i) => {
              const Icon = t.icon;
              const tone = toneClasses[t.tone];
              return (
                <Reveal key={t.name} delay={i * 100}>
                  <div className="premium-card rounded-3xl p-8 hover-lift h-full flex flex-col">
                    <div className="flex gap-0.5 mb-5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} className="text-yellow-bright text-lg">★</span>
                      ))}
                    </div>
                    <p className="text-lg font-medium text-foreground leading-relaxed flex-1">"{t.quote}"</p>
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                      <div className={`w-10 h-10 rounded-full ${tone.bg} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA + CONTACT */}
      <section id="contact" className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden bg-foreground text-background p-10 md:p-16 lg:p-20">
              {/* decorative pastel orbs */}
              <div className="absolute -top-20 -right-20 w-80 h-80 orb bg-yellow-bright opacity-40" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 orb bg-lavender-deep opacity-40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] orb bg-peach-deep opacity-25" />

              <div className="relative grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="chip bg-background/10 text-background border border-background/20 mb-5">
                    Get in touch
                  </span>
                  <h2 className="text-display-md font-semibold tracking-tight">
                    Ready to <span className="text-yellow-bright">light up</span> your shop floor?
                  </h2>
                  <p className="mt-5 text-lg text-background/75 leading-relaxed max-w-md">
                    Drop us a line and we'll show you exactly how Cyberyard fits your business.
                    Response within 24 hours.
                  </p>

                  <div className="mt-8 space-y-3">
                    {["Free consultation & demo", "No setup fees", "Cancel anytime"].map((b) => (
                      <div key={b} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-yellow-bright flex items-center justify-center">
                          <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                        </div>
                        <span className="text-base text-background/90">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-background text-foreground rounded-2xl p-7 md:p-8 shadow-2xl">
                  <form className="space-y-4">
                    <Input placeholder="Your name" className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10" />
                    <Input type="email" placeholder="Email address" className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10" />
                    <Input placeholder="Company name" className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10" />
                    <Textarea placeholder="Tell us about your business" className="min-h-[100px] rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-foreground/10 resize-none" />
                    <Button className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-base group">
                      Send message
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 border-t border-border bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-4">
              <img src={logo} alt="Cyberyard" className="h-14 mb-4" />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Wearable digital signage for modern retail.
                Promotions that walk the floor with your team.
              </p>
            </div>
            <div className="md:col-span-2 md:col-start-7">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-foreground mb-4">Product</p>
              <div className="space-y-2.5">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Features</a>
                <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground link-underline">How it works</a>
                <a href="#use-cases" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Use cases</a>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-foreground mb-4">Legal</p>
              <div className="space-y-2.5">
                <Link to="/privacy-policy" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Privacy Policy</Link>
                <Link to="/terms-of-service" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Terms of Service</Link>
                <Link to="/cookies-policy" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Cookies</Link>
                <Link to="/refund-policy" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Refund Policy</Link>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-foreground mb-4">Resources</p>
              <div className="space-y-2.5">
                <Link to="/data-processing-addendum" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Data Processing</Link>
                <Link to="/acceptable-use-policy" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Acceptable Use</Link>
                <Link to="/auth" className="block text-sm text-muted-foreground hover:text-foreground link-underline">Login</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2025 Cyberyard Limited. Registered in England & Wales.</p>
            <p>Built for retail.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
