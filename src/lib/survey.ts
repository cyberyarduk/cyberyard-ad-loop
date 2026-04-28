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
export const POST_TRIAL_SURVEY_VERSION = "v2_post_trial";

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

// ===== POST-TRIAL SURVEY (v2) =====
export const POST_TRIAL_QUESTIONS: Question[] = [
  { id: "pt1_used", type: "single", label: "Did you use the system during the 2-week trial?",
    options: [
      { value: "yes_regularly", label: "Yes (regularly)" },
      { value: "yes_few_times", label: "Yes (a few times)" },
      { value: "no", label: "No" },
    ] },
  { id: "pt1a_no_reason", type: "text", label: "What stopped you from using it?",
    placeholder: "Open answer…", multiline: true,
    showIf: (a) => a.pt1_used === "no" },

  { id: "pt2_ease", type: "single", label: "How easy was the system to use?",
    options: [
      { value: "very_easy", label: "Very easy" },
      { value: "easy", label: "Easy" },
      { value: "neutral", label: "Neutral" },
      { value: "difficult", label: "Difficult" },
      { value: "very_difficult", label: "Very difficult" },
    ] },
  { id: "pt2a_difficult_what", type: "text", label: "What, if anything, was confusing or difficult?",
    placeholder: "Open answer…", multiline: true },

  { id: "pt3_used_ai", type: "single", label: "Did you use the AI video generator?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ] },
  { id: "pt3a_ai_useful", type: "single", label: "How useful was the AI video generator?",
    showIf: (a) => a.pt3_used_ai === "yes",
    options: [
      { value: "very_useful", label: "Very useful" },
      { value: "somewhat_useful", label: "Somewhat useful" },
      { value: "not_useful", label: "Not useful" },
    ] },
  { id: "pt3b_ai_no_why", type: "text", label: "Why didn't you use the AI video generator?",
    placeholder: "Open answer…", multiline: true,
    showIf: (a) => a.pt3_used_ai === "no" },

  { id: "pt4_engagement", type: "single", label: "Did you notice any of the following during the trial?",
    options: [
      { value: "increased_engagement", label: "Increased customer engagement" },
      { value: "more_questions", label: "More questions about products" },
      { value: "increased_sales", label: "Increased sales" },
      { value: "no_difference", label: "No noticeable difference" },
    ] },
  { id: "pt4a_impact", type: "single", label: "Can you estimate the impact?",
    options: [
      { value: "small", label: "Small" },
      { value: "moderate", label: "Moderate" },
      { value: "significant", label: "Significant" },
    ] },

  { id: "pt5_easier_promote", type: "single", label: "Did this system make it easier to promote your products?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ] },
  { id: "pt5a_more_frequent", type: "single", label: "Did you update your promotions more frequently because of it?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ] },

  { id: "pt6_value", type: "single", label: "Do you feel this product adds value to your business?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ] },

  { id: "pt7_continue", type: "single", label: "Would you continue using this service after the trial?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "maybe", label: "Maybe" },
    ] },
  { id: "pt7a_plan", type: "single", label: "What plan would you choose?",
    showIf: (a) => a.pt7_continue === "yes",
    options: [
      { value: "basic_1_screen", label: "Basic (1 screen)" },
      { value: "multi_screen", label: "Multi-screen" },
      { value: "with_hardware", label: "With TV / hardware" },
    ] },
  { id: "pt7b_no_why", type: "text", label: "Why not?", placeholder: "Open answer…", multiline: true,
    showIf: (a) => a.pt7_continue === "no" },
  { id: "pt7c_maybe_what", type: "text", label: "What would need to change for you to say yes?",
    placeholder: "Open answer…", multiline: true,
    showIf: (a) => a.pt7_continue === "maybe" },

  { id: "pt8_price", type: "single", label: "What would you realistically be willing to pay per month?",
    options: [
      { value: "10_20", label: "£10–£20" },
      { value: "20_30", label: "£20–£30" },
      { value: "30_40", label: "£30–£40" },
      { value: "40_50", label: "£40–£50" },
      { value: "50_plus", label: "£50+" },
    ] },
  { id: "pt8a_pay_more", type: "single", label: "Would you pay more if it saved you time and increased sales?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ] },

  { id: "pt9_nps", type: "single", label: "How likely are you to recommend this to another business? (0 = not at all, 10 = extremely likely)",
    options: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) })) },

  { id: "pt10_improve", type: "text", label: "What is the ONE thing you would improve about this system?",
    placeholder: "Open answer…", multiline: true },
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

// Helpers — work across both surveys
const ALL_QUESTIONS = [...SURVEY_QUESTIONS, ...POST_TRIAL_QUESTIONS];
export function getQuestion(id: string) {
  return ALL_QUESTIONS.find((q) => q.id === id);
}
export function getOptionLabel(qId: string, value: string): string {
  const q = getQuestion(qId);
  if (!q || q.type !== "single") return value;
  return q.options.find((o) => o.value === value)?.label || value;
}
