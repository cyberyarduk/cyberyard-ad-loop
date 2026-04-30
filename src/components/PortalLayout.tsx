import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, Target, Building2, ClipboardList, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

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
        ]
      : [
          { path: "/admin", icon: LayoutDashboard, label: "Overview" },
          { path: "/admin/salespeople", icon: Users, label: "Salespeople" },
          { path: "/admin/salespeople/new", icon: UserPlus, label: "New Salesperson" },
          { path: "/companies", icon: Building2, label: "All Clients" },
          { path: "/admin/new-client", icon: Target, label: "Create Client" },
          { path: "/admin/research", icon: ClipboardList, label: "Market Research" },
          { path: "/admin/research/analytics", icon: BarChart3, label: "Research Analytics" },
        ];

  const portalLabel = variant === "sales" ? "Salesperson Portal" : "Admin Portal";

  const NavButton = ({ item, onClick }: { item: typeof navItems[number]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <Link to={item.path} onClick={onClick}>
        <button
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground/70 hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </button>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="mb-6">
        <Link to={variant === "sales" ? "/sales" : "/admin"} className="block">
          <div className="rounded-2xl bg-foreground/95 px-4 py-6 flex items-center justify-center">
            <img alt="Cyberyard" src={logo} className="h-20 w-auto object-contain brightness-0 invert" />
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

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavButton key={item.path} item={item} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      <div className="border-t border-border/60 pt-3 space-y-1">
        {profile && (
          <div className="px-3 mb-2">
            <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role.replace("_", " ")}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen relative">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-wash-warm opacity-80" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-background/30" />

      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center px-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-5 flex flex-col bg-background">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <Link to={variant === "sales" ? "/sales" : "/admin"} className="ml-3 flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-foreground/95 px-3 py-1.5 flex items-center justify-center shrink-0">
            <img alt="Cyberyard" src={logo} className="h-7 w-auto object-contain brightness-0 invert" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">{portalLabel}</span>
        </Link>
      </header>

      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-60 glass-card rounded-2xl p-5 flex-col z-40">
        {sidebarContent}
      </aside>

      <main className="lg:ml-[17rem] pt-20 lg:pt-8 px-4 lg:pr-8 pb-12">{children}</main>
    </div>
  );
};

export default PortalLayout;
