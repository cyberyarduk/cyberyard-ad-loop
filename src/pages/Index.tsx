import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Coffee,
  ShoppingBag,
  Dumbbell,
  Car,
  Wine,
  Calendar,
} from "lucide-react";
import logo from "@/assets/logo.png";
import Reveal from "@/components/editorial/Reveal";

const stats = [
  { value: "92%", label: "Of shoppers notice moving, wearable displays in the first 5 seconds" },
  { value: "3×", label: "More views than static posters or screens" },
  { value: "00:02", label: "Push new promotions to every device in seconds" },
  { value: "Zero", label: "Training required — staff just put it on and go" },
];

const features = [
  {
    n: "01",
    title: "Wearable displays",
    body: "Turn staff movement into marketing impact. Every step a touchpoint. Every interaction a promotion.",
  },
  {
    n: "02",
    title: "Instant content",
    body: "Update promotions across every device in seconds. No printing. No screens. No delays.",
  },
  {
    n: "03",
    title: "AI-powered creation",
    body: "Snap a photo, generate an offer video instantly — right on the shop floor.",
  },
  {
    n: "04",
    title: "Smart dashboard",
    body: "Monitor devices, batteries, playlists and content. Full control, total oversight.",
  },
];

const useCases = [
  { tag: "01", icon: Coffee, title: "Cafés & Bakeries", body: "Promote fresh pastries, lunch deals or end-of-day reductions." },
  { tag: "02", icon: ShoppingBag, title: "Retail Stores", body: "Highlight offers, new arrivals or flash sales as staff move through the store." },
  { tag: "03", icon: Dumbbell, title: "Gyms & Leisure", body: "Upsell memberships, classes and supplements." },
  { tag: "04", icon: Car, title: "Car Dealerships", body: "Show finance deals, service plans and promotions on the showroom floor." },
  { tag: "05", icon: Wine, title: "Bars & Restaurants", body: "Promote cocktails, happy hour and specials." },
  { tag: "06", icon: Calendar, title: "Events & Conferences", body: "Display schedules, sponsors and announcements on event staff." },
];

const trustedBy = ["Retail", "Hospitality", "Automotive", "Gyms", "Food & Beverage", "Events", "Conferences", "Showrooms"];

const Index = () => {
  return (
    <div className="min-h-screen bg-paper text-ink antialiased overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-paper/85 backdrop-blur-md border-b border-ink/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Cyberyard" className="h-10 md:h-12 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-10">
              {[
                { href: "#about", label: "About" },
                { href: "#how-it-works", label: "Process" },
                { href: "#use-cases", label: "Work" },
                { href: "#contact", label: "Contact" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-ink/80 hover:text-ink story-link"
                >
                  {l.label}
                </a>
              ))}
              <Link to="/auth">
                <Button size="sm" className="bg-ink text-paper hover:bg-ink/85 rounded-full px-5 font-medium">
                  Login <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Link to="/auth" className="md:hidden">
              <Button size="sm" className="bg-ink text-paper hover:bg-ink/85 rounded-full">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — editorial display headline */}
      <section className="relative pt-36 md:pt-48 pb-20 md:pb-32 px-6">
        <div className="container mx-auto max-w-[1400px]">
          {/* Top meta line */}
          <Reveal>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-ink/60 font-medium mb-12 md:mb-20">
              <span>Issue №01</span>
              <span className="hidden md:inline">Wearable Signage / Retail Marketing</span>
              <span>2025 — Ongoing</span>
            </div>
          </Reveal>

          {/* The headline */}
          <Reveal delay={100}>
            <h1 className="font-display-tight font-medium text-display-xl text-ink">
              Worn by your
              <br />
              team. <em className="italic font-light text-vermilion">Impossible</em>
              <br />
              to ignore.
            </h1>
          </Reveal>

          {/* Sub copy + CTA, asymmetric */}
          <div className="mt-12 md:mt-16 grid md:grid-cols-12 gap-8">
            <div className="md:col-span-5 md:col-start-1">
              <Reveal delay={200}>
                <div className="rule-thick pt-5">
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-ink/70 mb-3">
                    The brief
                  </p>
                  <p className="font-display text-2xl md:text-3xl leading-tight text-ink">
                    The world's first wearable digital signage platform built for retail engagement.
                  </p>
                </div>
              </Reveal>
            </div>
            <div className="md:col-span-5 md:col-start-8 flex flex-col justify-end">
              <Reveal delay={300}>
                <p className="text-base md:text-lg text-ink/70 mb-8 leading-relaxed">
                  When your staff move, your promotions move with them. Live, dynamic,
                  and built for retail. Every step becomes a marketing moment.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-ink text-paper hover:bg-ink/85 rounded-full h-14 px-7 text-base font-medium group">
                    Book a demo
                    <ArrowUpRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full h-14 px-7 text-base font-medium border-ink/30 text-ink hover:bg-ink hover:text-paper">
                    Watch it in action
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE — Trusted across industries */}
      <section className="relative py-6 bg-ink text-paper overflow-hidden">
        <div className="flex gap-16 animate-marquee-slow whitespace-nowrap">
          {[...trustedBy, ...trustedBy, ...trustedBy].map((t, i) => (
            <span key={i} className="font-display text-3xl md:text-5xl italic font-light flex items-center gap-16">
              {t}
              <span className="text-yellow-bright text-2xl">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* STATS — editorial table */}
      <section className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-[1400px]">
          <Reveal>
            <div className="rule-thick pt-6 mb-12 md:mb-16 flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold">
                Section 01 — By the numbers
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50 hidden md:block">
                Retail engagement metrics
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/10">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="bg-paper p-8 md:p-10 h-full flex flex-col justify-between min-h-[260px]">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
                    0{i + 1}
                  </p>
                  <div>
                    <p className="font-display-tight font-medium text-6xl md:text-7xl stat-number text-ink mb-4">
                      {s.value}
                    </p>
                    <p className="text-sm text-ink/70 leading-relaxed">{s.label}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT — color block + statement */}
      <section id="about" className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-[1400px]">
          <div className="grid md:grid-cols-12 gap-8 items-end mb-16">
            <Reveal className="md:col-span-3">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-ink/70">
                Section 02 — Manifesto
              </p>
            </Reveal>
            <Reveal className="md:col-span-9" delay={100}>
              <h2 className="font-display-tight font-medium text-display-md text-ink">
                Wearable signage,
                <br />
                <em className="italic font-light text-cobalt">built for the floor.</em>
              </h2>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            <Reveal className="md:col-span-5" delay={150}>
              <div className="bg-yellow-block p-10 md:p-12 aspect-square flex flex-col justify-between">
                <p className="font-display text-5xl md:text-6xl italic font-light text-ink leading-none">
                  Imagine.
                </p>
                <ul className="space-y-4 text-ink">
                  <li className="flex gap-4">
                    <span className="font-display italic text-xl text-ink/60 mt-1">i.</span>
                    <span className="text-base md:text-lg">A barista promoting the pastry of the day.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-display italic text-xl text-ink/60 mt-1">ii.</span>
                    <span className="text-base md:text-lg">A sales advisor showcasing the weekend offer.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-display italic text-xl text-ink/60 mt-1">iii.</span>
                    <span className="text-base md:text-lg">A staff member triggering interest just by walking past.</span>
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal className="md:col-span-7 md:pl-8 flex flex-col justify-between" delay={250}>
              <p className="font-display text-3xl md:text-4xl lg:text-5xl text-ink leading-[1.15] mb-10">
                Cyberyard combines lightweight wearable displays with a powerful cloud
                dashboard, enabling{" "}
                <em className="italic text-vermilion">real-time promotions</em> that
                meet customers right where they are — on the shop floor.
              </p>
              <div className="rule-hair pt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  In short
                </p>
                <p className="font-display text-2xl md:text-3xl mt-2">
                  In-store advertising made <em className="italic">dynamic, personal & alive</em>.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FEATURES — editorial table */}
      <section className="py-24 md:py-32 px-6 bg-ink text-paper">
        <div className="container mx-auto max-w-[1400px]">
          <Reveal>
            <div className="border-t-2 border-paper pt-6 mb-16 flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold">
                Section 03 — Capabilities
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-paper/50 hidden md:block">
                Four pillars
              </p>
            </div>
          </Reveal>

          <Reveal>
            <h2 className="font-display-tight font-medium text-display-md mb-16 max-w-5xl">
              Everything you need to{" "}
              <em className="italic font-light text-yellow-bright">go live</em>.
            </h2>
          </Reveal>

          <div className="divide-y divide-paper/20 border-t border-b border-paper/20">
            {features.map((f, i) => (
              <Reveal key={f.n} delay={i * 80}>
                <div className="grid md:grid-cols-12 gap-6 py-8 md:py-12 group hover:bg-paper/5 transition-colors px-2 md:px-4 -mx-2 md:-mx-4">
                  <p className="md:col-span-1 font-mono-tight text-sm text-paper/50 pt-1">{f.n}</p>
                  <h3 className="md:col-span-5 font-display text-3xl md:text-5xl font-medium text-paper leading-[1] group-hover:italic transition-all">
                    {f.title}
                  </h3>
                  <p className="md:col-span-5 text-base md:text-lg text-paper/70 leading-relaxed self-center">
                    {f.body}
                  </p>
                  <div className="md:col-span-1 flex justify-end items-center">
                    <ArrowUpRight className="h-6 w-6 text-paper/40 group-hover:text-yellow-bright group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS / HOW IT WORKS */}
      <section id="how-it-works" className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-[1400px]">
          <Reveal>
            <div className="rule-thick pt-6 mb-16">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold">
                Section 04 — Process
              </p>
            </div>
          </Reveal>

          <Reveal>
            <h2 className="font-display-tight font-medium text-display-md mb-20 max-w-4xl">
              Live in <em className="italic font-light text-vermilion">three steps</em>.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-ink/10">
            {[
              { n: "01", title: "Pair your devices", body: "Scan a QR code. Wearable displays connect to your business instantly.", color: "bg-vermilion-block text-paper" },
              { n: "02", title: "Create or upload", body: "Upload videos or generate offer videos in seconds.", color: "bg-cobalt-block text-paper" },
              { n: "03", title: "Go live instantly", body: "Assign a playlist and watch promotions update across the floor in real time.", color: "bg-yellow-block text-ink" },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 120}>
                <div className={`${step.color} p-10 md:p-12 aspect-[4/5] flex flex-col justify-between`}>
                  <p className="font-display-tight font-medium text-7xl md:text-8xl leading-none">
                    {step.n}
                  </p>
                  <div>
                    <h3 className="font-display text-3xl md:text-4xl font-medium mb-4 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-base opacity-90 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES — editorial grid */}
      <section id="use-cases" className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-[1400px]">
          <Reveal>
            <div className="rule-thick pt-6 mb-16">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold">
                Section 05 — Where it works
              </p>
            </div>
          </Reveal>

          <Reveal>
            <h2 className="font-display-tight font-medium text-display-md mb-16 max-w-4xl">
              Made for places where{" "}
              <em className="italic font-light text-cobalt">people gather</em>.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <Reveal key={uc.title} delay={i * 60}>
                  <div className="bg-paper p-8 md:p-10 ink-hover h-full min-h-[280px] flex flex-col justify-between cursor-pointer">
                    <div className="flex items-start justify-between">
                      <p className="font-mono-tight text-sm text-ink/50 ink-hover-muted">{uc.tag}</p>
                      <Icon className="h-7 w-7" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display text-3xl md:text-4xl font-medium mb-3 leading-tight">
                        {uc.title}
                      </h3>
                      <p className="text-sm md:text-base text-ink/70 ink-hover-muted leading-relaxed">
                        {uc.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY IT WORKS — pull quote spread */}
      <section className="py-24 md:py-40 px-6 bg-yellow-block">
        <div className="container mx-auto max-w-[1400px]">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <Reveal className="md:col-span-3">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-ink mb-2">
                Section 06
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/70">
                Why it works
              </p>
            </Reveal>
            <Reveal className="md:col-span-9" delay={120}>
              <p className="font-display-tight font-medium text-4xl md:text-6xl lg:text-7xl text-ink leading-[1.02]">
                "People notice <em className="italic font-light">movement</em>. People follow other people's <em className="italic font-light">attention</em>. People trust staff more than <em className="italic font-light">signs</em>."
              </p>
              <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-8 md:gap-12 max-w-4xl">
                {[
                  "Our brains are hardwired to detect motion — it's a survival instinct.",
                  "If your staff are engaging with something, customers notice — and follow.",
                  "A screen on a person feels personal, credible and human.",
                ].map((line, i) => (
                  <div key={i} className="border-t-2 border-ink pt-4">
                    <p className="font-mono-tight text-xs text-ink/60 mb-2">0{i + 1}</p>
                    <p className="text-base text-ink leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — editorial pull quotes */}
      <section className="py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-[1400px]">
          <Reveal>
            <div className="rule-thick pt-6 mb-16">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold">
                Section 07 — Testimonials
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-ink/10">
            {[
              { quote: "Our pastry sales doubled in the first week.", name: "Laura", role: "Bakery Manager" },
              { quote: "Customers stop staff to ask about offers — it works.", name: "Ben", role: "Retail Store Owner" },
              { quote: "The AI creator saved us hours. So easy.", name: "Jade", role: "Café Owner" },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="bg-paper p-10 md:p-12 h-full flex flex-col justify-between min-h-[360px]">
                  <p className="font-display text-7xl text-vermilion leading-none">"</p>
                  <p className="font-display text-2xl md:text-3xl text-ink leading-tight my-6">
                    {t.quote}
                  </p>
                  <div className="rule-hair pt-4">
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-sm text-ink/60">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT — editorial colophon */}
      <section id="contact" className="py-24 md:py-32 px-6 bg-ink text-paper">
        <div className="container mx-auto max-w-[1400px]">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-6">
              <Reveal>
                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-paper/60 mb-6">
                  Section 08 — Contact
                </p>
                <h2 className="font-display-tight font-medium text-display-lg leading-[0.9]">
                  Let's
                  <br />
                  <em className="italic font-light text-yellow-bright">talk.</em>
                </h2>
                <p className="text-lg text-paper/80 mt-8 max-w-md leading-relaxed">
                  Ready to transform your retail advertising? Drop us a line and we'll
                  be in touch within 24 hours.
                </p>
              </Reveal>
            </div>

            <div className="md:col-span-6">
              <Reveal delay={150}>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-paper/60 font-semibold block">
                      Name
                    </label>
                    <Input placeholder="Your name" className="h-12 bg-transparent border-0 border-b border-paper/30 rounded-none px-0 text-paper placeholder:text-paper/40 focus-visible:ring-0 focus-visible:border-yellow-bright" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-paper/60 font-semibold block">
                      Email
                    </label>
                    <Input type="email" placeholder="hello@company.com" className="h-12 bg-transparent border-0 border-b border-paper/30 rounded-none px-0 text-paper placeholder:text-paper/40 focus-visible:ring-0 focus-visible:border-yellow-bright" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-paper/60 font-semibold block">
                      Company
                    </label>
                    <Input placeholder="Company name" className="h-12 bg-transparent border-0 border-b border-paper/30 rounded-none px-0 text-paper placeholder:text-paper/40 focus-visible:ring-0 focus-visible:border-yellow-bright" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-paper/60 font-semibold block">
                      Message
                    </label>
                    <Textarea placeholder="Tell us about your needs" className="min-h-[100px] bg-transparent border-0 border-b border-paper/30 rounded-none px-0 text-paper placeholder:text-paper/40 focus-visible:ring-0 focus-visible:border-yellow-bright resize-none" />
                  </div>
                  <Button className="w-full md:w-auto h-14 px-10 bg-yellow-bright text-ink hover:bg-yellow-bright/90 rounded-full text-base font-semibold group">
                    Send message
                    <ArrowUpRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                </form>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER — colophon */}
      <footer className="py-16 px-6 bg-paper border-t border-ink/10">
        <div className="container mx-auto max-w-[1400px]">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-4">
              <img src={logo} alt="Cyberyard" className="h-14 mb-4" />
              <p className="text-sm text-ink/70 max-w-xs leading-relaxed">
                Wearable digital signage for modern retail. Worn by your team.
                Impossible to ignore.
              </p>
            </div>
            <div className="md:col-span-2 md:col-start-7">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-ink mb-4">Company</p>
              <div className="space-y-2">
                <a href="#about" className="block text-sm text-ink/70 hover:text-ink story-link">About</a>
                <a href="#how-it-works" className="block text-sm text-ink/70 hover:text-ink story-link">Process</a>
                <a href="#contact" className="block text-sm text-ink/70 hover:text-ink story-link">Contact</a>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-ink mb-4">Legal</p>
              <div className="space-y-2">
                <Link to="/privacy-policy" className="block text-sm text-ink/70 hover:text-ink story-link">Privacy Policy</Link>
                <Link to="/terms-of-service" className="block text-sm text-ink/70 hover:text-ink story-link">Terms of Service</Link>
                <Link to="/cookies-policy" className="block text-sm text-ink/70 hover:text-ink story-link">Cookies</Link>
                <Link to="/refund-policy" className="block text-sm text-ink/70 hover:text-ink story-link">Refund Policy</Link>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-ink mb-4">Resources</p>
              <div className="space-y-2">
                <Link to="/data-processing-addendum" className="block text-sm text-ink/70 hover:text-ink story-link">Data Processing</Link>
                <Link to="/acceptable-use-policy" className="block text-sm text-ink/70 hover:text-ink story-link">Acceptable Use</Link>
                <Link to="/auth" className="block text-sm text-ink/70 hover:text-ink story-link">Login</Link>
              </div>
            </div>
          </div>
          <div className="rule-thick pt-6 flex flex-col md:flex-row justify-between gap-4 text-xs uppercase tracking-[0.2em] text-ink/60">
            <p>© 2025 Cyberyard Limited</p>
            <p>Registered in England & Wales</p>
            <p>Made for retail</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
