export const BUSINESS_TYPES = [
  "Retail Shop",
  "Coffee Shop",
  "Pub",
  "Restaurant",
  "Takeaway",
  "Salon / Barber",
  "Gym",
  "Other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
