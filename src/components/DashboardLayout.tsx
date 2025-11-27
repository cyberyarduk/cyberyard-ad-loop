import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Video, List, Monitor, MapPin, LogOut, Building2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
interface DashboardLayoutProps {
  children: ReactNode;
}
const DashboardLayout = ({
  children
}: DashboardLayoutProps) => {
  const location = useLocation();
  const { isSuperAdmin, signOut, profile, company } = useAuth();

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
  return <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card p-4 flex flex-col">
        <div className="mb-8">
          <img alt="Cyberyard" src="/lovable-uploads/3d9a1351-c885-486a-b21b-eaea718cc995.png" className="h-48 w-full object-contain" />
          {!isSuperAdmin && company && (
            <p className="text-sm text-muted-foreground mt-3">{company.name}</p>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path}>
                <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start">
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>;
        })}
        </nav>

        <div className="border-t pt-4 space-y-2">
          {profile && (
            <div className="px-2 mb-2">
              <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {profile.role.replace('_', ' ')}
              </p>
            </div>
          )}
          <Link to="/settings">
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
      </aside>

      <main className="ml-64 p-8">{children}</main>
    </div>;
};
export default DashboardLayout;