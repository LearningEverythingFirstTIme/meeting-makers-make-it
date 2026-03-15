export const DASHBOARD_SECTION_IDS = [
  "sobrietyCounter",
  "weeklyStat",
  "activeStat",
  "latestStat",
  "treasurySummary",
  "addMeeting",
  "recentCheckins",
  "yourMeetings",
  "activityTracker",
  "weeklyLog",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export type Meeting = {
  id: string;
  userId: string;
  name: string;
  location: string;
  time: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Checkin = {
  id: string;
  userId: string;
  meetingId: string;
  meetingName: string;
  dayKey: string;
  note?: string;
  createdAt?: Date;
};

export type TransactionType = 'contribution' | 'expense';

export type ContributionCategory = 
  | 'seventh_tradition'
  | 'literature'
  | 'coffee'
  | 'facility'
  | 'special_event'
  | 'online'
  | 'other';

export type ExpenseCategory = 
  | 'rent'
  | 'utilities'
  | 'coffee_supplies'
  | 'literature'
  | 'phone_website'
  | 'insurance'
  | 'bank_fees'
  | 'supplies'
  | 'other';

export type TreasuryCategory = ContributionCategory | ExpenseCategory;

export type TreasuryTransaction = {
  id: string;
  userId: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: TreasuryCategory;
  note: string;
  synced?: boolean; // true once Firestore confirms the write
  createdAt?: Date;
  updatedAt?: Date;
};

export type TreasurySummary = {
  contributions: number;
  expenses: number;
  net: number;
  transactionCount: number;
};

export type UserProfile = {
  userId: string;
  sobrietyDate?: string;
  dashboardLayout?: DashboardSectionId[];
  updatedAt?: Date;
};

export type SobrietyMilestone = {
  days: number;
  label: string;
  chipColor: string;
  description: string;
};

export type MeetingType = 'B' | 'C' | 'D' | 'M' | 'MED' | 'O' | 'PH' | 'S' | 'ST' | 'TR' | 'VM' | 'W' | 'X';

// A listing from the AA meeting directory (JSON data files, one per state).
// Named MeetingListing to distinguish from the user's own Meeting type above.
export type MeetingListing = {
  name: string;
  slug: string;
  day: number; // 0=Sun, 1=Mon, ..., 6=Sat
  time: string; // "HH:MM"
  location: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  types: MeetingType[];
  notes: string;
  group: string;
  wheelchair: boolean;
  source?: string;
  conference_url?: string; // Zoom meetings only
};

// Legacy aliases — remove once all consumers are updated
export type NJMeetingType = MeetingType;
export type NJMeeting = MeetingListing;

export type DailyInventory = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  resentments?: string;
  fears?: string;
  dishonesty?: string;
  amends?: string;
  gratitude?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
