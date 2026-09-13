import type { Metadata } from "next";

import TeamRoad3D from "@/components/scene/TeamRoad3D";
import SiteNav from "@/components/ui/SiteNav";
import { COMMITTEE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Team — CESA",
  description: "Meet the 2025 committee of the Computer Engineering Students' Association, VIT.",
};

export default function TeamPage() {
  return (
    <main className="relative">
      {/* The nav sits over the walk's first screen and scrolls away with the
          page; the walk's own canvas is sticky underneath it. */}
      <div className="absolute inset-x-0 top-0 z-30">
        <SiteNav />
      </div>
      <TeamRoad3D members={COMMITTEE} />
    </main>
  );
}
