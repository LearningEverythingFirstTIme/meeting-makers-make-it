import { readFileSync } from "fs";
import path from "path";
import type { MeetingListing } from "@/types";

/**
 * Registry of states that have meeting data files in src/data/.
 * Add a new entry here as each state's JSON files are added.
 * Key: two-letter lowercase state code. Value: full state name.
 */
export const AVAILABLE_STATES: Record<string, string> = {
  nj: "New Jersey",
  pa: "Pennsylvania",
};

/**
 * Loads all meetings for a given state by reading its JSON files from src/data/.
 * Expects files named: {state}-meetings.json and {state}-zoom-meetings.json
 * Missing files are silently skipped (some states may only have one format).
 */
export function loadMeetings(stateCode: string): MeetingListing[] {
  const normalized = stateCode.toLowerCase().replace(/[^a-z]/g, "");
  const dataDir = path.join(process.cwd(), "src", "data");
  const meetings: MeetingListing[] = [];

  for (const suffix of ["meetings", "zoom-meetings"]) {
    try {
      const filePath = path.join(dataDir, `${normalized}-${suffix}.json`);
      const raw = readFileSync(filePath, "utf8");
      const data = JSON.parse(raw) as MeetingListing[];
      meetings.push(...data);
    } catch {
      // File doesn't exist for this state/format — skip silently
    }
  }

  return meetings;
}
