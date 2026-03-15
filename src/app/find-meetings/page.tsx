import { Suspense } from "react";
import FindMeetingsPageClient from "@/components/pages/find-meetings-page-client";
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
      <FindMeetingsPageClient 
        meetings={meetings} 
        stateCode={stateCode} 
        availableStates={AVAILABLE_STATES}
      />
    </Suspense>
  );
}
