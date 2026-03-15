"use client";

import { useMemo } from "react";
import { addDays, startOfWeek, toLocalDayKey } from "@/lib/date";
import type { Checkin } from "@/types";

export type ActivityDay = {
  key: string;
  date: Date;
  count: number;
  level: number;
  isToday: boolean;
};

export type ActivityWeek = {
  label: string;
  days: ActivityDay[];
};

const ACTIVITY_WEEKS = 16;
const ACTIVITY_LEVELS = [0, 1, 2, 3, 4] as const;

const activityLevelForCount = (count: number) => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
};

export type UseActivityGridResult = {
  activityGrid: ActivityWeek[];
  activityToneByLevel: readonly string[];
  activityShadowByLevel: readonly string[];
  activityLevels: readonly number[];
  activityWeeks: number;
};

export const useActivityGrid = (checkins: Checkin[]): UseActivityGridResult => {
  const todayKey = toLocalDayKey();

  const activityGrid = useMemo(() => {
    const dayCounts = new Map<string, number>();
    for (const entry of checkins) {
      dayCounts.set(entry.dayKey, (dayCounts.get(entry.dayKey) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startOfWeek(addDays(today, -(ACTIVITY_WEEKS - 1) * 7));
    const weeks: ActivityWeek[] = [];

    for (let weekIndex = 0; weekIndex < ACTIVITY_WEEKS; weekIndex += 1) {
      const weekStart = addDays(start, weekIndex * 7);
      const days = Array.from({ length: 7 }, (_, dayOffset) => {
        const date = addDays(weekStart, dayOffset);
        const key = toLocalDayKey(date);
        const count = dayCounts.get(key) ?? 0;
        return {
          key,
          date,
          count,
          level: activityLevelForCount(count),
          isToday: key === todayKey,
        };
      });

      weeks.push({
        label: weekStart.getDate() <= 7 ? weekStart.toLocaleString(undefined, { month: "short" }).toUpperCase() : "",
        days,
      });
    }

    return weeks;
  }, [checkins, todayKey]);

  return {
    activityGrid,
    activityToneByLevel: [
      "var(--white)",
      "var(--butter)",
      "var(--sky)",
      "var(--mint)",
      "var(--coral)",
    ],
    activityShadowByLevel: [
      "2px 2px 0px 0px var(--black)",
      "2px 2px 0px 0px var(--black)",
      "2px 2px 0px 0px var(--black)",
      "2px 2px 0px 0px var(--black)",
      "2px 2px 0px 0px var(--black)",
    ],
    activityLevels: ACTIVITY_LEVELS,
    activityWeeks: ACTIVITY_WEEKS,
  };
};

// Constants for use in components
export const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
