"use client";

import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/loading-skeleton";

const TreasuryContent = dynamic(
  () => import("@/components/pages/treasury-content").then((mod) => mod.TreasuryContent),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: false,
  }
);

export default function TreasuryPage() {
  return <TreasuryContent />;
}
