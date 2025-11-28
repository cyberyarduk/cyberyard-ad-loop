import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Video, List, Monitor, MapPin, LogOut, Building2, Settings, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
interface DashboardLayoutProps {
  children: ReactNode;
}
const DashboardLayout = ({
  children
}: DashboardLayoutProps) => {
  const location = useLocation();
  const { isSuperAdmin, signOut, profile, company } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [{
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard"
  }, {
    path: "/venues",
    icon: MapPin,
    label: "Venues"
  }, {
    path: "/devices",
    icon: Monitor,
    label: "Devices"
  }, {
    path: "/videos",
    icon: Video,
    label: "Videos"
  }, {
    path: "/playlists",
    icon: List,
    label: "Playlists"
  }, ...(isSuperAdmin ? [{
    path: "/companies",
    icon: Building2,
    label: "Companies"
  }] : [])];
  const sidebarContent = (
    <>
      <div className="mb-2">
        <img alt="Cyberyard" src={logo} className="h-32 w-full object-contain" />
        {!isSuperAdmin && company && (
          <p className="text-xs text-muted-foreground mt-1">{company.name}</p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
            <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start">
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>;
        })}
      </nav>

      <div className="border-t pt-2 space-y-1">
        {profile && (
          <div className="px-2 mb-2">
            <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile.role.replace('_', ' ')}
            </p>
          </div>
        )}
        <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card flex items-center px-4 z-50">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 border-r border-border bg-card p-4 flex-col">
        {sidebarContent}
      </aside>

      <main className="lg:ml-64 pt-20 lg:pt-8 p-4 lg:p-8">{children}</main>
    </div>;
};
export default DashboardLayout;