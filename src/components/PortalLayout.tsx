import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, Target, Building2, ClipboardList, BarChart3, Tv, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import BottomNav from "@/components/BottomNav";

interface PortalLayoutProps {
  children: ReactNode;
  variant: "sales" | "admin";
}

const PortalLayout = ({ children, variant }: PortalLayoutProps) => {
  const location = useLocation();
  const { signOut, profile, salesperson } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems =
    variant === "sales"
      ? [
          { path: "/sales", icon: LayoutDashboard, label: "My Dashboard" },
          { path: "/sales/new-client", icon: UserPlus, label: "New Client" },
          { path: "/sales/clients", icon: Building2, label: "All Clients" },
          { path: "/player", icon: Tv, label: "Media Player" },
        ]
      : [
          { path: "/admin", icon: LayoutDashboard, label: "Overview" },
          { path: "/admin/salespeople", icon: Users, label: "Salespeople" },
          { path: "/admin/salespeople/new", icon: UserPlus, label: "New Salesperson" },
          { path: "/companies", icon: Building2, label: "All Clients" },
          { path: "/admin/new-client", icon: Target, label: "Create Client" },
          { path: "/admin/research", icon: ClipboardList, label: "Market Research" },
          { path: "/admin/research/analytics", icon: BarChart3, label: "Research Analytics" },
          { path: "/player", icon: Tv, label: "Media Player" },
        ];

  const portalLabel = variant === "sales" ? "Salesperson Portal" : "Admin Portal";

  const NavButton = ({ item, onClick }: { item: typeof navItems[number]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <Link to={item.path} onClick={onClick}>
        <button
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground/80 hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </button>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col pb-6">
      <div className="mb-4 shrink-0">
        <Link to={variant === "sales" ? "/sales" : "/admin"} className="block">
          <div className="rounded-2xl bg-foreground/95 px-4 py-4 flex items-center justify-center overflow-hidden">
            <img alt="Cyberyard" src={logo} className="block h-auto w-full max-w-[6.75rem] object-contain brightness-0 invert" />
          </div>
        </Link>
        <div className="chip mt-3 bg-yellow-soft text-foreground/80">
          {portalLabel}
        </div>
        {variant === "sales" && salesperson && (
          <p className="text-xs text-muted-foreground mt-2">
            #{salesperson.employee_number} · {salesperson.area || "No area"}
          </p>
        )}
      </div>

      <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
        {navItems.map((item) => (
          <NavButton key={item.path} item={item} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      <div className="mt-3 border-t border-border/60 pt-2 space-y-0.5 shrink-0 rounded-xl bg-secondary/60 p-1.5">
        {profile && (
          <div className="px-3 mb-1.5">
            <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role.replace("_", " ")}</p>
          </div>
        )}
        <NavButton
          item={{ path: "/settings", icon: Settings, label: "Settings" }}
          onClick={() => setMobileOpen(false)}
        />
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );


  return (
    <div className="native-app-shell min-h-screen relative">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-wash-warm opacity-80" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-background/30" />

      <header
        className="lg:hidden fixed top-0 left-0 right-0 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center px-4 z-50"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
          height: 'calc(4rem + env(safe-area-inset-top, 0px) + 0.5rem)',
        }}
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-5 flex h-full flex-col overflow-hidden bg-background">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <Link to={variant === "sales" ? "/sales" : "/admin"} className="ml-3 flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-foreground/95 h-9 px-2.5 flex items-center justify-center shrink-0 overflow-hidden">
            <img alt="Cyberyard" src={logo} className="block h-5 w-auto object-contain brightness-0 invert" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">{portalLabel}</span>
        </Link>
      </header>

      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-60 glass-card rounded-2xl p-5 flex-col overflow-hidden z-40">
        {sidebarContent}
      </aside>

      <main
        className="native-app-scroll lg:ml-[17rem] lg:pt-8 px-4 lg:pr-8 pb-28"
        style={{ paddingTop: 'calc(5.5rem + env(safe-area-inset-top, 0px))' }}
      >{children}</main>

      <BottomNav
        items={
          variant === "sales"
            ? [
                { path: "/sales", icon: LayoutDashboard, label: "Home" },
                { path: "/sales/clients", icon: Building2, label: "Clients" },
                { path: "/sales/new-client", icon: UserPlus, label: "New" },
                { path: "/player", icon: Tv, label: "Player" },
              ]
            : [
                { path: "/admin", icon: LayoutDashboard, label: "Home" },
                { path: "/companies", icon: Building2, label: "Clients" },
                { path: "/admin/research", icon: ClipboardList, label: "Research" },
                { path: "/player", icon: Tv, label: "Player" },
              ]
        }
      />
    </div>
  );
};

export default PortalLayout;
