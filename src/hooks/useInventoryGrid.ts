"use client";

import { useMemo } from "react";
import { addDays, startOfWeek, toLocalDayKey } from "@/lib/date";
import type { DailyInventory } from "@/types";

export type InventoryDay = {
  key: string;
  date: Date;
  hasEntry: boolean;
  hasGratitude: boolean;
  isToday: boolean;
};

export type InventoryWeek = {
  label: string;
  days: InventoryDay[];
};

const INVENTORY_WEEKS = 16;

export type UseInventoryGridResult = {
  inventoryGrid: InventoryWeek[];
  inventoryWeeks: number;
  totalInventoryDays: number;
  totalGratitudeDays: number;
  currentStreak: number;
  longestStreak: number;
};

const hasAnyContent = (entry: DailyInventory): boolean => {
  return (
    (entry.resentments?.trim() !== "") ||
    (entry.fears?.trim() !== "") ||
    (entry.dishonesty?.trim() !== "") ||
    (entry.amends?.trim() !== "") ||
    (entry.gratitude?.trim() !== "")
  );
};

export const useInventoryGrid = (entries: DailyInventory[]): UseInventoryGridResult => {
  const todayKey = toLocalDayKey();

  const { inventoryGrid, totalInventoryDays, totalGratitudeDays, currentStreak, longestStreak } = useMemo(() => {
    const inventoryDays = new Set<string>();
    const gratitudeDays = new Set<string>();
    
    for (const entry of entries) {
      if (hasAnyContent(entry)) {
        inventoryDays.add(entry.date);
      }
      if (entry.gratitude && entry.gratitude.trim() !== "") {
        gratitudeDays.add(entry.date);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startOfWeek(addDays(today, -(INVENTORY_WEEKS - 1) * 7));
    const weeks: InventoryWeek[] = [];

    for (let weekIndex = 0; weekIndex < INVENTORY_WEEKS; weekIndex += 1) {
      const weekStart = addDays(start, weekIndex * 7);
      const days = Array.from({ length: 7 }, (_, dayOffset) => {
        const date = addDays(weekStart, dayOffset);
        const key = toLocalDayKey(date);
        return {
          key,
          date,
          hasEntry: inventoryDays.has(key),
          hasGratitude: gratitudeDays.has(key),
          isToday: key === todayKey,
        };
      });

      weeks.push({
        label: weekStart.getDate() <= 7 ? weekStart.toLocaleString(undefined, { month: "short" }).toUpperCase() : "",
        days,
      });
    }

    let currStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    while (inventoryDays.has(toLocalDayKey(checkDate))) {
      currStreak++;
      checkDate = addDays(checkDate, -1);
    }

    let longStreak = 0;
    let tempStreak = 0;
    const allDates = Array.from(inventoryDays).sort();
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
      inventoryGrid: weeks,
      totalInventoryDays: inventoryDays.size,
      totalGratitudeDays: gratitudeDays.size,
      currentStreak: currStreak,
      longestStreak: longStreak,
    };
  }, [entries, todayKey]);

  return {
    inventoryGrid,
    inventoryWeeks: INVENTORY_WEEKS,
    totalInventoryDays,
    totalGratitudeDays,
    currentStreak,
    longestStreak,
  };
};

export const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
