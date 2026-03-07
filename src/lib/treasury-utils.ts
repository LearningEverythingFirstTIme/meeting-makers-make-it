import type { TreasuryTransaction, TreasurySummary, ContributionCategory, ExpenseCategory } from "@/types";

export const CONTRIBUTION_CATEGORIES: Record<ContributionCategory, { label: string; description: string }> = {
  seventh_tradition: { label: "7th Tradition", description: "Basket collection" },
  literature: { label: "Literature", description: "Books, pamphlets" },
  coffee: { label: "Coffee/Refreshments", description: "Coffee, snacks" },
  facility: { label: "Facility", description: "Room rental contribution" },
  special_event: { label: "Special Event", description: "Anniversaries, events" },
  online: { label: "Online/Virtual", description: "Virtual meeting contributions" },
  other: { label: "Other", description: "Miscellaneous" },
};

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; description: string }> = {
  rent: { label: "Rent", description: "Facility rental" },
  utilities: { label: "Utilities", description: "Electric, water, gas" },
  coffee_supplies: { label: "Coffee/Supplies", description: "Coffee, creamer, cups" },
  literature: { label: "Literature", description: "Books, pamphlets purchased" },
  phone_website: { label: "Phone/Website", description: "Hotline, website costs" },
  insurance: { label: "Insurance", description: "Liability insurance" },
  bank_fees: { label: "Bank Fees", description: "Account charges" },
  supplies: { label: "General Supplies", description: "Paper, pens, etc." },
  other: { label: "Other", description: "Miscellaneous" },
};

export const getCategoryLabel = (type: 'contribution' | 'expense', category: string): string => {
  if (type === 'contribution') {
    return CONTRIBUTION_CATEGORIES[category as ContributionCategory]?.label ?? category;
  }
  return EXPENSE_CATEGORIES[category as ExpenseCategory]?.label ?? category;
};

export const calculateSummary = (transactions: TreasuryTransaction[]): TreasurySummary => {
  const contributions = transactions
    .filter(t => t.type === 'contribution')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    contributions,
    expenses,
    net: contributions - expenses,
    transactionCount: transactions.length,
  };
};

export const getAverageContribution = (transactions: TreasuryTransaction[]): number => {
  const contributions = transactions.filter(t => t.type === 'contribution');
  if (contributions.length === 0) return 0;
  const total = contributions.reduce((sum, t) => sum + Number(t.amount), 0);
  return total / contributions.length;
};

export const filterByDateRange = (
  transactions: TreasuryTransaction[],
  startDate: Date,
  endDate: Date
): TreasuryTransaction[] => {
  return transactions.filter(t => {
    const date = new Date(t.date);
    return date >= startDate && date <= endDate;
  });
};

export const groupByMonth = (transactions: TreasuryTransaction[]): Record<string, TreasuryTransaction[]> => {
  const groups: Record<string, TreasuryTransaction[]> = {};
  
  for (const t of transactions) {
    const monthKey = t.date.substring(0, 7);
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(t);
  }
  
  return groups;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getTodayDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const sortByDateDesc = (a: TreasuryTransaction, b: TreasuryTransaction): number => {
  return b.date.localeCompare(a.date);
};