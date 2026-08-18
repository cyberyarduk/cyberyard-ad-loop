import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { hapticImpact } from "@/lib/haptics";

/**
 * Native-only: gives a light tap vibration whenever the user presses any
 * button, link, tab, switch or menu item — the way a native app feels.
 */
const GlobalHaptics = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const selector =
      'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], input[type="checkbox"], input[type="radio"], label[for]';

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest) return;
      const el = target.closest(selector) as HTMLElement | null;
      if (!el) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      if (el.dataset.noHaptics !== undefined) return;
      void hapticImpact("medium");
    };

    document.addEventListener("click", onClick, { passive: true, capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
};

export default GlobalHaptics;
