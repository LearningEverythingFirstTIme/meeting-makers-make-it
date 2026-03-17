"use client";

import { useMemo } from "react";
import { addDays, startOfWeek, toLocalDayKey } from "@/lib/date";
import type { DailyInventory } from "@/types";

export type GratitudeDay = {
  key: string;
  date: Date;
  hasGratitude: boolean;
  isToday: boolean;
};

export type GratitudeWeek = {
  label: string;
  days: GratitudeDay[];
};

const GRATITUDE_WEEKS = 16;

export type UseGratitudeGridResult = {
  gratitudeGrid: GratitudeWeek[];
  gratitudeWeeks: number;
  totalGratitudeDays: number;
  currentStreak: number;
  longestStreak: number;
};

export const useGratitudeGrid = (entries: DailyInventory[]): UseGratitudeGridResult => {
  const todayKey = toLocalDayKey();

  const { gratitudeGrid, totalGratitudeDays, currentStreak, longestStreak } = useMemo(() => {
    const gratitudeDays = new Set<string>();
    for (const entry of entries) {
      if (entry.gratitude && entry.gratitude.trim() !== "") {
        gratitudeDays.add(entry.date);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startOfWeek(addDays(today, -(GRATITUDE_WEEKS - 1) * 7));
    const weeks: GratitudeWeek[] = [];

    for (let weekIndex = 0; weekIndex < GRATITUDE_WEEKS; weekIndex += 1) {
      const weekStart = addDays(start, weekIndex * 7);
      const days = Array.from({ length: 7 }, (_, dayOffset) => {
        const date = addDays(weekStart, dayOffset);
        const key = toLocalDayKey(date);
        return {
          key,
          date,
          hasGratitude: gratitudeDays.has(key),
          isToday: key === todayKey,
        };
      });

      weeks.push({
        label: weekStart.getDate() <= 7 ? weekStart.toLocaleString(undefined, { month: "short" }).toUpperCase() : "",
        days,
      });
    }

    const sortedDays = Array.from(gratitudeDays).sort().reverse();
    
    let currStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    while (gratitudeDays.has(toLocalDayKey(checkDate))) {
      currStreak++;
      checkDate = addDays(checkDate, -1);
    }

    let longStreak = 0;
    let tempStreak = 0;
    const allDates = Array.from(gratitudeDays).sort();
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(allDates[i - 1] + 'T12:00:00');
        const currDate = new Date(allDates[i] + 'T12:00:00');
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longStreak = Math.max(longStreak, tempStreak);
    }

    return {
      gratitudeGrid: weeks,
      totalGratitudeDays: gratitudeDays.size,
      currentStreak: currStreak,
      longestStreak: longStreak,
    };
  }, [entries, todayKey]);

  return {
    gratitudeGrid,
    gratitudeWeeks: GRATITUDE_WEEKS,
    totalGratitudeDays,
    currentStreak,
    longestStreak,
  };
};

export const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
