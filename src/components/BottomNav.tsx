import { createPortal } from "react-dom";
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

  const nav = (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border/60 bg-background/95 backdrop-blur-xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        // Force its own compositing layer so iOS rubber-band scrolling
        // can't drag the bar up and down with the page.
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname === item.path ||
                (location.pathname.startsWith(item.path + "/") &&
                  !items.some(
                    (other) =>
                      other !== item &&
                      other.path.startsWith(item.path + "/") &&
                      (location.pathname === other.path ||
                        location.pathname.startsWith(other.path + "/"))
                  ));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-90 ${
                isActive ? "text-primary" : "text-foreground/60"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  if (typeof document === "undefined") return nav;
  return createPortal(nav, document.body);
};

export default BottomNav;
