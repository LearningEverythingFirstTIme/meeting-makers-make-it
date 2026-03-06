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
  createdAt?: Date;
  updatedAt?: Date;
};

export type TreasurySummary = {
  contributions: number;
  expenses: number;
  net: number;
  transactionCount: number;
};