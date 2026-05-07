// Hardcoded survey schema. Bump SURVEY_VERSION when changing the pre-trial schema.
import { BUSINESS_TYPES } from "./businessTypes";

export type Choice = { value: string; label: string };

export type Question =
  | {
      id: string;
      type: "single";
      label: string;
      options: Choice[];
      showIf?: (a: Record<string, any>) => boolean;
    }
  | {
      id: string;
      type: "multi";
      label: string;
      options: Choice[];
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

export const SURVEY_VERSION = "v3";
export const MANAGER_SURVEY_VERSION = "v3_manager";
export const POST_TRIAL_SURVEY_VERSION = "v2_post_trial";

export type RespondentRole = "owner" | "manager";

const yesNo: Choice[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
const yesNoMaybe: Choice[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export const SURVEY_QUESTIONS: Question[] = [
  // Q1
  {
    id: "q1_has_screen",
    type: "single",
    label: "Do you currently have a TV, screen, or device (e.g. iPad) in your shop?",
    options: yesNo,
  },
  {
    id: "q1a_uses_for_promo",
    type: "single",
    label: "Do you currently use it to display promotions or content?",
    showIf: (a) => a.q1_has_screen === "yes",
    options: yesNo,
  },
  {
    id: "q1b_displays",
    type: "multi",
    label: "What do you typically display? (select all that apply)",
    showIf: (a) => a.q1_has_screen === "yes" && a.q1a_uses_for_promo === "yes",
    options: [
      { value: "tv_channels", label: "TV channels" },
      { value: "static_images", label: "Static images" },
      { value: "slideshows", label: "Slideshows" },
      { value: "videos", label: "Videos" },
      { value: "menu_boards", label: "Menu boards" },
    ],
  },
  {
    id: "q1c_update_method",
    type: "multi",
    label: "How do you currently update it? (select all that apply)",
    showIf: (a) => a.q1_has_screen === "yes" && a.q1a_uses_for_promo === "yes",
    options: [
      { value: "usb", label: "USB" },
      { value: "laptop", label: "Laptop / computer" },
      { value: "third_party", label: "Someone else manages it" },
      { value: "rarely", label: "Rarely updated" },
    ],
  },
  {
    id: "q1d_has_cost",
    type: "single",
    label: "Does it cost you anything to run or manage?",
    showIf: (a) => a.q1_has_screen === "yes" && a.q1a_uses_for_promo === "yes",
    options: yesNo,
  },
  {
    id: "q1e_cost_range",
    type: "single",
    label: "Roughly how much per month?",
    showIf: (a) => a.q1d_has_cost === "yes",
    options: [
      { value: "0_10", label: "£0–£10" },
      { value: "10_30", label: "£10–£30" },
      { value: "30_50", label: "£30–£50" },
      { value: "50_plus", label: "£50+" },
    ],
  },
  {
    id: "q1f_consider_screen",
    type: "single",
    label: "Would you consider using a screen for promotions in the future?",
    showIf: (a) => a.q1_has_screen === "no",
    options: yesNoMaybe,
  },

  // Q2
  {
    id: "q2_promo_methods",
    type: "multi",
    label: "How do you currently promote offers or products in-store? (select all that apply)",
    options: [
      { value: "posters", label: "Posters / printed materials" },
      { value: "verbal", label: "Verbal only" },
      { value: "social_media", label: "Social media" },
      { value: "screens", label: "Screens" },
      { value: "none", label: "We don’t actively promote" },
    ],
  },
  {
    id: "q2a_spends_on_ads",
    type: "single",
    label: "Do you currently spend money on advertising or promotions?",
    options: yesNo,
  },
  {
    id: "q2b_ad_spend_range",
    type: "single",
    label: "Roughly how much per month?",
    showIf: (a) => a.q2a_spends_on_ads === "yes",
    options: [
      { value: "0_20", label: "£0–£20" },
      { value: "20_50", label: "£20–£50" },
      { value: "50_100", label: "£50–£100" },
      { value: "100_plus", label: "£100+" },
    ],
  },

  // Q3
  {
    id: "q3_update_ease",
    type: "single",
    label: "How easy is it to update your promotions currently?",
    options: [
      { value: "very_easy", label: "Very easy" },
      { value: "somewhat_easy", label: "Somewhat easy" },
      { value: "time_consuming", label: "Time-consuming" },
      { value: "very_difficult", label: "Very difficult" },
    ],
  },

  // Q4
  {
    id: "q4_phone_control_interest",
    type: "single",
    label: "Would you be interested in a simple system to control what’s shown on your screen from your phone?",
    options: yesNoMaybe,
  },

  // Q5
  {
    id: "q5_ai_video_interest",
    type: "single",
    label: "Would you use a feature that lets you photograph a product, add text (e.g. “Bacon sandwich £4.99”) and instantly create a video advert?",
    options: yesNoMaybe,
  },

  // Q6
  {
    id: "q6_try_today",
    type: "single",
    label: "If Cyberyard was available today, would you try it in your business?",
    options: yesNoMaybe,
  },

  // Q7
  {
    id: "q7_price_reasonable",
    type: "single",
    label: "We are considering pricing around £40–£50 per month. Does this sound reasonable?",
    options: yesNoMaybe,
  },
  {
    id: "q7a_expected_price",
    type: "single",
    label: "What monthly price would you expect for a service like this?",
    showIf: (a) => a.q7_price_reasonable === "no" || a.q7_price_reasonable === "maybe",
    options: [
      { value: "10_20", label: "£10–£20" },
      { value: "20_30", label: "£20–£30" },
      { value: "30_40", label: "£30–£40" },
      { value: "40_50", label: "£40–£50" },
      { value: "50_plus", label: "£50+" },
    ],
  },

  // Q8
  {
    id: "q8_update_frequency",
    type: "single",
    label: "How often do you update your promotions?",
    options: [
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
      { value: "rarely", label: "Rarely" },
    ],
  },

  // Q9
  {
    id: "q9_setup_pref",
    type: "multi",
    label: "If needed, what setup would you prefer? (select all that apply)",
    options: [
      { value: "use_existing", label: "Use existing screen" },
      { value: "buy", label: "Buy a screen" },
      { value: "rent", label: "Rent a screen" },
      { value: "not_sure", label: "Not sure" },
    ],
  },

  // Q10
  {
    id: "q10_trial_interest",
    type: "single",
    label: "Would you be interested in a free 2-week trial when we launch?",
    options: yesNo,
  },

  // Q11
  {
    id: "q11_open_feedback",
    type: "text",
    label: "What do you think would help bring more customers into your business?",
    placeholder: "Open answer…",
    multiline: true,
  },
];

// ===== MANAGER SURVEY (shorter — managers usually don't know pricing/budget) =====
// Reuses question IDs from SURVEY_QUESTIONS so analytics can aggregate across both.
export const MANAGER_SURVEY_QUESTIONS: Question[] = [
  // Screen / current usage
  SURVEY_QUESTIONS.find((q) => q.id === "q1_has_screen")!,
  SURVEY_QUESTIONS.find((q) => q.id === "q1a_uses_for_promo")!,
  SURVEY_QUESTIONS.find((q) => q.id === "q1b_displays")!,
  SURVEY_QUESTIONS.find((q) => q.id === "q1c_update_method")!,
  SURVEY_QUESTIONS.find((q) => q.id === "q1f_consider_screen")!,
  // Interest in product
  SURVEY_QUESTIONS.find((q) => q.id === "q5_ai_video_interest")!,
  SURVEY_QUESTIONS.find((q) => q.id === "q6_try_today")!,
  // Free trial
  SURVEY_QUESTIONS.find((q) => q.id === "q10_trial_interest")!,
  // Owner callback details
  {
    id: "m_owner_name",
    type: "text",
    label: "Owner's name (so we can follow up directly)",
    placeholder: "Owner's full name",
  },
  {
    id: "m_owner_phone",
    type: "text",
    label: "Owner's phone number",
    placeholder: "Best number to reach the owner",
  },
  {
    id: "m_owner_email",
    type: "text",
    label: "Owner's email (optional)",
    placeholder: "owner@business.co.uk",
  },
  {
    id: "m_best_callback_time",
    type: "text",
    label: "Best time to call the owner",
    placeholder: "e.g. weekday mornings",
  },
];

const LEGACY_SURVEY_QUESTIONS: Question[] = [
  { id: "q1a_screen_use", type: "multi", label: "What do you use it for?", options: [
    { value: "promotions", label: "Promotions" },
    { value: "tv_entertainment", label: "TV / Entertainment" },
    { value: "nothing", label: "Nothing" },
    { value: "other", label: "Other" },
  ] },
  { id: "q1b_consider_screen", type: "single", label: "Would you consider using a screen for promotions?", options: yesNo },
  { id: "q2_promotes", type: "single", label: "Do you currently promote offers or products in-store?", options: yesNo },
  { id: "q2a_promo_method", type: "multi", label: "How do you promote them?", options: [
    { value: "posters", label: "Posters" },
    { value: "printed_menus", label: "Printed menus" },
    { value: "screens", label: "Screens" },
    { value: "word_of_mouth", label: "Word of mouth" },
    { value: "other", label: "Other" },
  ] },
  { id: "q2a_promo_method_other", type: "text", label: "Please describe the other method you use" },
  { id: "q4_interested", type: "single", label: "Interested in a simple promotion system?", options: yesNoMaybe },
  { id: "q5_pay_40_50", type: "single", label: "Consider £40–£50/month?", options: yesNo },
  { id: "q5a_price_pref", type: "single", label: "Preferred price range", options: [
    { value: "10_20", label: "£10–£20" }, { value: "20_30", label: "£20–£30" },
    { value: "30_40", label: "£30–£40" }, { value: "40_50", label: "£40–£50" },
    { value: "50_plus", label: "£50+" },
  ] },
  { id: "q6_screen_pref", type: "single", label: "Screen preference", options: [
    { value: "use_existing", label: "Use existing screen" },
    { value: "buy", label: "Buy a screen" },
    { value: "rent", label: "Rent a screen" },
  ] },
  { id: "q8_ai_video", type: "single", label: "Photo + text → video useful?", options: yesNo },
  { id: "q7_update_freq", type: "single", label: "How often do you update promotions?", options: [
    { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }, { value: "rarely", label: "Rarely" },
  ] },
  { id: "q9_trial", type: "single", label: "Interested in a free 2-week trial?", options: yesNo },
  { id: "q10_open", type: "text", label: "What would help bring more customers?" },
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

  { id: "pt3_used_ai", type: "single", label: "Did you use the AI video generator?", options: yesNo },
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

  { id: "pt4_engagement", type: "multi", label: "Did you notice any of the following during the trial? (select all that apply)",
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

  { id: "pt5_easier_promote", type: "single", label: "Did this system make it easier to promote your products?", options: yesNo },
  { id: "pt5a_more_frequent", type: "single", label: "Did you update your promotions more frequently because of it?", options: yesNo },

  { id: "pt6_value", type: "single", label: "Do you feel this product adds value to your business?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ] },

  { id: "pt7_continue", type: "single", label: "Would you continue using this service after the trial?", options: yesNoMaybe },
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
  { id: "pt8a_pay_more", type: "single", label: "Would you pay more if it saved you time and increased sales?", options: yesNo },

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

// Helpers — work across current + manager + legacy + post-trial questions
const MANAGER_ONLY_QUESTIONS = MANAGER_SURVEY_QUESTIONS.filter(
  (mq) => !SURVEY_QUESTIONS.some((q) => q.id === mq.id),
);
const ALL_QUESTIONS = [
  ...SURVEY_QUESTIONS,
  ...MANAGER_ONLY_QUESTIONS,
  ...LEGACY_SURVEY_QUESTIONS,
  ...POST_TRIAL_QUESTIONS,
];
export function getQuestion(id: string) {
  return ALL_QUESTIONS.find((q) => q.id === id);
}
export function getOptionLabel(qId: string, value: string): string {
  const q = getQuestion(qId);
  if (!q || (q.type !== "single" && q.type !== "multi")) return value;
  return q.options.find((o) => o.value === value)?.label || value;
}

// Lookup the right question schema for a given stored response version.
export function getQuestionsForVersion(version: string): Question[] {
  if (version === SURVEY_VERSION) return SURVEY_QUESTIONS;
  if (version === MANAGER_SURVEY_VERSION) return MANAGER_SURVEY_QUESTIONS;
  if (version === POST_TRIAL_SURVEY_VERSION) return POST_TRIAL_QUESTIONS;
  // Legacy pre-trial responses (v1, v2-pre, etc.)
  return [...LEGACY_SURVEY_QUESTIONS, ...SURVEY_QUESTIONS];
}

export function getQuestionsForRole(role: RespondentRole): Question[] {
  return role === "manager" ? MANAGER_SURVEY_QUESTIONS : SURVEY_QUESTIONS;
}
export function getVersionForRole(role: RespondentRole): string {
  return role === "manager" ? MANAGER_SURVEY_VERSION : SURVEY_VERSION;
}

