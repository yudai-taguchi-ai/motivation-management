"use client";

import dynamic from "next/dynamic";

const DayView = dynamic(() => import("@/components/DayView"), { ssr: false });

export default function ClientOnly() {
  return <DayView />;
}
