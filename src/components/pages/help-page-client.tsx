"use client";

import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/loading-skeleton";

const HelpContent = dynamic(
  () => import("@/components/pages/help-content").then((mod) => mod.HelpContent),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: false,
  }
);

export default function HelpPage() {
  return <HelpContent />;
}
