import { describe, expect, test } from "vitest";
import {
  calculateDaysSober,
  getCurrentMilestone,
  getNextMilestone,
  getMilestoneProgress,
  formatSobrietyDate,
  getAnniversaryText,
  SOBRIETY_MILESTONES,
} from "./sobriety-utils";

describe("sobriety utils", () => {
  test("calculateDaysSober returns correct days", () => {
    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);
    const dateStr = fiveDaysAgo.toISOString().split('T')[0];
    
    expect(calculateDaysSober(dateStr)).toBe(5);
  });

  test("calculateDaysSober returns 0 for future date", () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 5);
    const dateStr = future.toISOString().split('T')[0];
    
    expect(calculateDaysSober(dateStr)).toBe(0);
  });

  test("getCurrentMilestone returns correct milestone", () => {
    // 45 days should return 30 day milestone
    const milestone = getCurrentMilestone(45);
    expect(milestone).not.toBeNull();
    expect(milestone?.days).toBe(30);
    expect(milestone?.label).toBe("30 DAYS");
  });

  test("getCurrentMilestone returns null for less than 1 day", () => {
    const milestone = getCurrentMilestone(0);
    expect(milestone).toBeNull();
  });

  test("getNextMilestone returns correct next milestone", () => {
    // 45 days should return 60 day milestone
    const milestone = getNextMilestone(45);
    expect(milestone).not.toBeNull();
    expect(milestone?.days).toBe(60);
    expect(milestone?.label).toBe("60 DAYS");
  });

  test("getNextMilestone returns null after last milestone", () => {
    const lastMilestone = SOBRIETY_MILESTONES[SOBRIETY_MILESTONES.length - 1];
    const milestone = getNextMilestone(lastMilestone.days + 1);
    expect(milestone).toBeNull();
  });

  test("getMilestoneProgress calculates percentage correctly", () => {
    // At 45 days (between 30 and 60)
    const progress = getMilestoneProgress(45);
    expect(progress.current).toBe(45);
    expect(progress.next).toBe(60);
    // 15 days out of 30 day range = 50%
    expect(progress.percent).toBe(50);
  });

  test("getAnniversaryText returns days for less than 30", () => {
    expect(getAnniversaryText(15)).toBe("15 DAYS SOBER");
  });

  test("getAnniversaryText returns months for 30-364 days", () => {
    expect(getAnniversaryText(60)).toBe("2 MONTHS SOBER");
    expect(getAnniversaryText(30)).toBe("1 MONTH SOBER");
  });

  test("getAnniversaryText returns years for 365+ days", () => {
    expect(getAnniversaryText(365)).toBe("1 YEAR SOBER");
    expect(getAnniversaryText(730)).toBe("2 YEARS SOBER");
  });

  test("formatSobrietyDate formats date correctly", () => {
    const formatted = formatSobrietyDate("2024-01-15");
    expect(formatted).toContain("January");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2024");
  });
});
