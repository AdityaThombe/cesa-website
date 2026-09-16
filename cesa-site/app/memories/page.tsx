import type { Metadata } from "next";

import MemoriesWall from "@/components/memories/MemoriesWall";
import SiteNav from "@/components/ui/SiteNav";

export const metadata: Metadata = {
  title: "Memories — CESA",
  description: "Moments from CESA events, workshops and hackathons at VIT.",
};

export default function MemoriesPage() {
  return (
    <main className="relative">
      <div className="absolute inset-x-0 top-0 z-30">
        <SiteNav />
      </div>
      <MemoriesWall />
    </main>
  );
}
