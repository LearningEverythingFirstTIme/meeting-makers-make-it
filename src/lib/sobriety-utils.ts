import type { SobrietyMilestone } from "@/types";

export const SOBRIETY_MILESTONES: SobrietyMilestone[] = [
  { days: 1, label: "24 HOURS", chipColor: "#FFFFFF", description: "One day at a time" },
  { days: 30, label: "30 DAYS", chipColor: "#C0C0C0", description: "1 month" },
  { days: 60, label: "60 DAYS", chipColor: "#FF0000", description: "2 months" },
  { days: 90, label: "90 DAYS", chipColor: "#4169E1", description: "3 months" },
  { days: 180, label: "6 MONTHS", chipColor: "#FFD700", description: "Half year" },
  { days: 270, label: "9 MONTHS", chipColor: "#228B22", description: "9 months" },
  { days: 365, label: "1 YEAR", chipColor: "#CD7F32", description: "First anniversary" },
  { days: 547, label: "18 MONTHS", chipColor: "#A9A9A9", description: "Year and a half" },
  { days: 730, label: "2 YEARS", chipColor: "#4169E1", description: "Second anniversary" },
  { days: 1095, label: "3 YEARS", chipColor: "#FFD700", description: "Third anniversary" },
  { days: 1460, label: "4 YEARS", chipColor: "#FFD700", description: "Fourth anniversary" },
  { days: 1825, label: "5 YEARS", chipColor: "#8B4513", description: "Five years" },
  { days: 2555, label: "7 YEARS", chipColor: "#B8860B", description: "Seven years" },
  { days: 3650, label: "10 YEARS", chipColor: "#000000", description: "Decade" },
  { days: 5475, label: "15 YEARS", chipColor: "#000000", description: "Fifteen years" },
  { days: 7300, label: "20 YEARS", chipColor: "#000000", description: "Twenty years" },
  { days: 9125, label: "25 YEARS", chipColor: "#000000", description: "Silver anniversary" },
  { days: 10950, label: "30 YEARS", chipColor: "#000000", description: "Thirty years" },
  { days: 14600, label: "40 YEARS", chipColor: "#000000", description: "Forty years" },
  { days: 18250, label: "50 YEARS", chipColor: "#000000", description: "Golden anniversary" },
];

export const calculateDaysSober = (sobrietyDate: string): number => {
  const start = new Date(sobrietyDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getNextMilestone = (daysSober: number): SobrietyMilestone | null => {
  return SOBRIETY_MILESTONES.find(m => m.days > daysSober) || null;
};

export const getCurrentMilestone = (daysSober: number): SobrietyMilestone | null => {
  const passed = SOBRIETY_MILESTONES.filter(m => m.days <= daysSober);
  return passed[passed.length - 1] || null;
};

export const getMilestoneProgress = (daysSober: number): { current: number; next: number; percent: number } => {
  const currentMilestone = getCurrentMilestone(daysSober);
  const nextMilestone = getNextMilestone(daysSober);
  
  if (!nextMilestone) {
    return { current: daysSober, next: daysSober, percent: 100 };
  }
  
  const startDays = currentMilestone?.days || 0;
  const endDays = nextMilestone.days;
  const range = endDays - startDays;
  const progress = daysSober - startDays;
  const percent = Math.min(100, Math.max(0, (progress / range) * 100));
  
  return { current: daysSober, next: endDays, percent };
};

export const formatSobrietyDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getAnniversaryText = (daysSober: number): string => {
  if (daysSober < 30) return `${daysSober} DAYS SOBER`;
  if (daysSober < 365) {
    const months = Math.floor(daysSober / 30);
    return `${months} MONTH${months === 1 ? '' : 'S'} SOBER`;
  }
  const years = Math.floor(daysSober / 365);
  const remainingDays = daysSober % 365;
  if (remainingDays < 30) {
    return `${years} YEAR${years === 1 ? '' : 'S'} SOBER`;
  }
  return `${years} YEAR${years === 1 ? '' : 'S'} SOBER`;
};
