// Hardcoded survey schema (v1). Future: move to DB if you need editable surveys.
import { BUSINESS_TYPES } from "./businessTypes";

export type Choice = { value: string; label: string };

export type Question =
  | {
      id: string;
      type: "single";
      label: string;
      options: Choice[];
      // showIf: when this evaluates true given current answers, show the question
      showIf?: (a: Record<string, any>) => boolean;
    }
  | {
      id: string;
      type: "text";
      label: string;
      placeholder?: string;
      multiline?: boolean;
      showIf?: (a: Record<string, any>) => boolean;
    };

export const SURVEY_VERSION = "v1";

export const SURVEY_QUESTIONS: Question[] = [
  {
    id: "q1_has_screen",
    type: "single",
    label: "Do you currently have a TV or screen in your shop?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q1a_screen_use",
    type: "single",
    label: "What do you use it for?",
    showIf: (a) => a.q1_has_screen === "yes",
    options: [
      { value: "promotions", label: "Promotions" },
      { value: "tv_entertainment", label: "TV / Entertainment" },
      { value: "nothing", label: "Nothing" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "q1b_consider_screen",
    type: "single",
    label: "Would you consider using a screen for promotions?",
    showIf: (a) => a.q1_has_screen === "no",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q2_promotes",
    type: "single",
    label: "Do you currently promote offers or products in-store?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q2a_promo_method",
    type: "single",
    label: "How do you promote them?",
    showIf: (a) => a.q2_promotes === "yes",
    options: [
      { value: "posters", label: "Posters" },
      { value: "printed_menus", label: "Printed menus" },
      { value: "screens", label: "Screens" },
      { value: "word_of_mouth", label: "Word of mouth" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "q3_update_ease",
    type: "single",
    label: "How easy is it to update your promotions?",
    options: [
      { value: "very_easy", label: "Very easy" },
      { value: "somewhat_easy", label: "Somewhat easy" },
      { value: "time_consuming", label: "Time-consuming" },
      { value: "very_difficult", label: "Very difficult" },
    ],
  },
  {
    id: "q4_interested",
    type: "single",
    label: "Would you be interested in a simple system to display promotions on a screen?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "maybe", label: "Maybe" },
    ],
  },
  {
    id: "q5_pay_40_50",
    type: "single",
    label: "Would you consider this service at £40–£50 per month?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q5a_price_pref",
    type: "single",
    label: "What price range would you prefer?",
    showIf: (a) => a.q5_pay_40_50 === "no",
    options: [
      { value: "10_20", label: "£10–£20" },
      { value: "20_30", label: "£20–£30" },
      { value: "30_40", label: "£30–£40" },
      { value: "40_50", label: "£40–£50" },
      { value: "50_plus", label: "£50+" },
    ],
  },
  {
    id: "q6_screen_pref",
    type: "single",
    label: "If needed, what would you prefer?",
    options: [
      { value: "use_existing", label: "Use existing screen" },
      { value: "buy", label: "Buy a screen" },
      { value: "rent", label: "Rent a screen" },
    ],
  },
  {
    id: "q7_update_freq",
    type: "single",
    label: "How often do you update promotions?",
    options: [
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
      { value: "rarely", label: "Rarely" },
    ],
  },
  {
    id: "q8_ai_video",
    type: "single",
    label: "Would it be useful to create a video by taking a photo + adding text (AI-generated promotion)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q9_trial",
    type: "single",
    label: "Would you be interested in a free 2-week trial?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q10_open",
    type: "text",
    label: "What would help bring more customers into your business?",
    placeholder: "Open answer…",
    multiline: true,
  },
];

export const LEAD_STATUSES = [
  { value: "new_lead", label: "New Lead" },
  { value: "trial_offered", label: "Trial Offered" },
  { value: "trial_active", label: "Trial Active" },
  { value: "trial_completed", label: "Trial Completed" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not Interested" },
] as const;

export const RESEARCH_BUSINESS_TYPES = BUSINESS_TYPES;

// Helpers for analytics — get a label for a given answer value
export function getQuestion(id: string) {
  return SURVEY_QUESTIONS.find((q) => q.id === id);
}
export function getOptionLabel(qId: string, value: string): string {
  const q = getQuestion(qId);
  if (!q || q.type !== "single") return value;
  return q.options.find((o) => o.value === value)?.label || value;
}
