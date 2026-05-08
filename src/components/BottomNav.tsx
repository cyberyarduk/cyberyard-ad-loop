import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";

export interface BottomNavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

const BottomNav = ({ items }: BottomNavProps) => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border/60 bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-primary" : "text-foreground/60"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
