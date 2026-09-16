import type { Metadata } from "next";

import TeamBackdrop from "@/components/team/TeamBackdrop";
import TeamGrid from "@/components/team/TeamGrid";
import SiteNav from "@/components/ui/SiteNav";
import { CORE, TEAMS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Team — CESA",
  description: "Meet the 2025 committee of the Computer Engineering Students' Association, VIT.",
};

export default function TeamPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip" style={{ backgroundColor: "var(--color-washi)" }}>
      {/* The walk, scrubbed by scroll, sits behind everything on the page. */}
      <TeamBackdrop />

      <div className="absolute inset-x-0 top-0 z-30">
        <SiteNav />
      </div>

      <header className="relative z-10 px-6 pb-10 text-center sm:pb-14" style={{ paddingTop: "max(150px, 13vw)" }}>
        <p data-reveal className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-ink/55">
          Committee 2025
        </p>
        <div
          data-reveal
          className="mt-4 flex items-center justify-center gap-4 sm:gap-6"
          style={{ ["--reveal-delay" as string]: "100ms" }}
        >
          <span aria-hidden="true" className="h-[5px] w-10 bg-ink sm:w-24" />
          <h1 className="whitespace-nowrap font-machine font-normal leading-none text-ink" style={{ fontSize: "clamp(3rem, 7vw, 7.5rem)" }}>
            OUR TEAM
          </h1>
          <span aria-hidden="true" className="h-[5px] w-10 bg-ink sm:w-24" />
        </div>
        <p
          data-reveal
          className="mx-auto mt-5 max-w-xl font-segoe text-ink/75"
          style={{ fontSize: "clamp(1rem, 1.6vw, 1.5rem)", ["--reveal-delay" as string]: "200ms" }}
        >
          The people who make CESA happen, from the core committee to every team behind the events.
        </p>
      </header>

      <div className="relative z-10">
        <TeamGrid core={CORE} teams={TEAMS} />
      </div>
    </main>
  );
}
