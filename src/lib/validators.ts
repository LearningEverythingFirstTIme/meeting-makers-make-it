import { z } from "zod";

export const meetingSchema = z.object({
  name: z.string().trim().min(2, "Meeting name is required").max(100),
  location: z.string().trim().min(2, "Location is required").max(160),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format"),
});

export type MeetingInput = z.infer<typeof meetingSchema>;
