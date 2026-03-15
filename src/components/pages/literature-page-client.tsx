"use client";

import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/loading-skeleton";

const LiteratureContent = dynamic(
  () => import("@/components/pages/literature-content").then((mod) => mod.LiteratureContent),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: false,
  }
);

export default function LiteraturePage() {
  return <LiteratureContent />;
}
