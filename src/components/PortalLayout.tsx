import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, Target, Building2 } from "lucide-react";
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
        ];

  const accent = variant === "sales"
    ? "from-violet-500/10 via-fuchsia-500/5 to-rose-500/10"
    : "from-sky-500/10 via-cyan-500/5 to-emerald-500/10";

  const sidebarContent = (
    <>
      <div className="mb-4">
        <img alt="Cyberyard" src={logo} className="h-20 w-full object-contain" />
        <div className={`mt-2 rounded-full bg-gradient-to-r ${accent} px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/70 text-center`}>
          {variant === "sales" ? "Salesperson Portal" : "Admin Portal"}
        </div>
        {variant === "sales" && salesperson && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            #{salesperson.employee_number} · {salesperson.area || "No area"}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
              <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start">
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-2 space-y-1">
        {profile && (
          <div className="px-2 mb-2">
            <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role.replace("_", " ")}</p>
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Soft pastel wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50">
        <div className={`absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br ${accent} blur-3xl`} />
      </div>

      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card flex items-center px-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 flex flex-col">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <img alt="Cyberyard" src={logo} className="h-10 w-auto object-contain ml-4" />
      </header>

      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 border-r border-border bg-card/80 backdrop-blur p-4 flex-col">
        {sidebarContent}
      </aside>

      <main className="lg:ml-64 pt-20 lg:pt-8 p-4 lg:p-8">{children}</main>
    </div>
  );
};

export default PortalLayout;
