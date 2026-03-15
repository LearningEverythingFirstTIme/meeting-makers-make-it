"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/loading-skeleton";
import type { MeetingListing } from "@/types";

const MeetingFinder = dynamic(
  () => import("@/components/meeting-finder").then((mod) => mod.MeetingFinder),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: false,
  }
);

interface FindMeetingsPageClientProps {
  meetings: MeetingListing[];
  stateCode: string;
  availableStates: Record<string, string>;
}

export default function FindMeetingsPageClient({ meetings, stateCode, availableStates }: FindMeetingsPageClientProps) {
  return (
    <Suspense>
      <MeetingFinder
        meetings={meetings}
        stateCode={stateCode}
        availableStates={availableStates}
      />
    </Suspense>
  );
}
