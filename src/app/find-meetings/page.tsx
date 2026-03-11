import { Suspense } from "react";
import { MeetingFinder } from "@/components/meeting-finder";
import { loadMeetings, AVAILABLE_STATES } from "@/lib/meetings";

interface Props {
  searchParams: Promise<{ state?: string }>;
}

export default async function FindMeetingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const stateCode = (params.state || "nj").toLowerCase().replace(/[^a-z]/g, "");

  const meetings = loadMeetings(stateCode);

  return (
    <Suspense>
      <MeetingFinder
        meetings={meetings}
        stateCode={stateCode}
        availableStates={AVAILABLE_STATES}
      />
    </Suspense>
  );
}
