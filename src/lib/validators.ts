import { z } from "zod";
import { DASHBOARD_SECTION_IDS } from "@/types";

export const meetingSchema = z.object({
  name: z.string().trim().min(2, "Meeting name is required").max(100),
  location: z.string().trim().min(2, "Location is required").max(160),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format"),
});

export type MeetingInput = z.infer<typeof meetingSchema>;

const contributionCategories = ['seventh_tradition', 'literature', 'coffee', 'facility', 'special_event', 'online', 'other'] as const;
const expenseCategories = ['rent', 'utilities', 'coffee_supplies', 'literature', 'phone_website', 'insurance', 'bank_fees', 'supplies', 'other'] as const;
const allCategories = [...contributionCategories, ...expenseCategories] as const;

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)"),
  amount: z.number().min(0.01, "Amount must be at least $0.01"),
  type: z.enum(['contribution', 'expense']),
  category: z.enum(allCategories),
  note: z.string().trim().max(200).default(''),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const isValidContributionCategory = (category: string): category is typeof contributionCategories[number] => {
  return contributionCategories.includes(category as typeof contributionCategories[number]);
};

export const isValidExpenseCategory = (category: string): category is typeof expenseCategories[number] => {
  return expenseCategories.includes(category as typeof expenseCategories[number]);
};

export const sobrietyDateSchema = z.object({
  sobrietyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)"),
});

export type SobrietyDateInput = z.infer<typeof sobrietyDateSchema>;

export const checkinUpdateSchema = z.object({
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)"),
  note: z.string().trim().max(500, "Note must be 500 characters or less").optional(),
});

export type CheckinUpdateInput = z.infer<typeof checkinUpdateSchema>;

export const dashboardSectionIdSchema = z.enum(DASHBOARD_SECTION_IDS);

export const dashboardLayoutSchema = z.array(dashboardSectionIdSchema).length(
  DASHBOARD_SECTION_IDS.length,
  `Layout must include all ${DASHBOARD_SECTION_IDS.length} dashboard sections`,
).refine(
  (layout) => new Set(layout).size === DASHBOARD_SECTION_IDS.length,
  "Layout sections must be unique",
);

export type DashboardLayoutInput = z.infer<typeof dashboardLayoutSchema>;

export const normalizeDashboardLayout = (value: unknown): DashboardLayoutInput => {
  const parsed = dashboardLayoutSchema.safeParse(value);

  if (parsed.success) {
    return parsed.data;
  }

  return [...DASHBOARD_SECTION_IDS];
};

// Daily Inventory Validator
export const dailyInventorySchema = z.object({
  resentments: z.string().max(200).optional(),
  fears: z.string().max(200).optional(),
  dishonesty: z.string().max(200).optional(),
  amends: z.string().max(200).optional(),
  gratitude: z.string().max(200).optional(),
});

export type DailyInventoryInput = z.infer<typeof dailyInventorySchema>;
