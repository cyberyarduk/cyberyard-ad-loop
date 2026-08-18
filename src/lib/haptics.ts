import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const isNative = () => Capacitor.isNativePlatform();

/** Web fallback so browsers that support it still buzz. */
const webVibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
};

export const hapticSelection = async () => {
  if (!isNative()) return webVibrate(8);
  try {
    await Haptics.selectionChanged();
  } catch {
    /* ignore */
  }
};

export const hapticImpact = async (style: "light" | "medium" | "heavy" = "light") => {
  if (!isNative()) return webVibrate(style === "heavy" ? 30 : style === "medium" ? 18 : 10);
  try {
    await Haptics.impact({
      style:
        style === "heavy"
          ? ImpactStyle.Heavy
          : style === "medium"
            ? ImpactStyle.Medium
            : ImpactStyle.Light,
    });
  } catch {
    /* ignore */
  }
};

export const hapticSuccess = async () => {
  if (!isNative()) return webVibrate([10, 40, 10]);
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* ignore */
  }
};

export const hapticWarning = async () => {
  if (!isNative()) return webVibrate([20, 60, 20]);
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    /* ignore */
  }
};

export const hapticError = async () => {
  if (!isNative()) return webVibrate([30, 60, 30, 60, 30]);
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    /* ignore */
  }
};
