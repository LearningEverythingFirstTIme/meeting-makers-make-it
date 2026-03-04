import { describe, expect, test } from "vitest";
import { makeCheckinId, startOfWeek, toLocalDayKey } from "./date";

describe("date utils", () => {
  test("toLocalDayKey returns YYYY-MM-DD", () => {
    const value = toLocalDayKey(new Date("2026-03-04T14:00:00"));
    expect(value).toBe("2026-03-04");
  });

  test("startOfWeek returns Monday at local midnight", () => {
    const start = startOfWeek(new Date("2026-03-05T18:45:00")); // Thursday
    expect(start.getDay()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  test("makeCheckinId composes deterministic id", () => {
    expect(makeCheckinId("u1", "m2", "2026-03-04")).toBe("u1_m2_2026-03-04");
  });
});
