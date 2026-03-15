"use client";

import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/loading-skeleton";

const InventoryContent = dynamic(
  () => import("@/components/pages/inventory-content").then((mod) => mod.InventoryContent),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: false,
  }
);

export default function InventoryPage() {
  return <InventoryContent />;
}
