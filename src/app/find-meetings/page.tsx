import { MeetingFinder } from "@/components/meeting-finder";
import njMeetingsRaw from "@/data/nj-meetings.json";
import njZoomMeetingsRaw from "@/data/nj-zoom-meetings.json";
import type { NJMeeting } from "@/types";

export default function FindMeetingsPage() {
  const inPersonMeetings = njMeetingsRaw as NJMeeting[];
  const zoomMeetings = njZoomMeetingsRaw as NJMeeting[];
  const allMeetings: NJMeeting[] = [...inPersonMeetings, ...zoomMeetings];

  return <MeetingFinder meetings={allMeetings} />;
}
