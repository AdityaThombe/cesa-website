import Link from "next/link";

import TeamRoad from "@/components/sections/TeamRoad";
import Logo from "@/components/ui/Logo";
import MemberCard from "@/components/ui/MemberCard";
import { COMMITTEE, DEVELOPERS } from "@/lib/content";

export default function TeamPage() {
  return (
    <main style={{ backgroundColor: "var(--color-washi)" }}>
      <header className="flex items-center justify-between px-18 py-9">
        <Logo className="text-ink" />
        <Link href="/" className="text-sm tracking-[0.06em] text-ink/70 hover:text-ink">
          ← Home
        </Link>
      </header>

      <section className="px-18 pb-10 pt-8 text-center">
        <p className="font-mono text-[0.6875rem] tracking-[0.34em] text-muted">02 — TEAM</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,4rem)] leading-tight text-ink">
          The 2025 Committee
        </h1>
      </section>

      {/* Preview of the Figma "Member Card" pull — not wired into TeamRoad's
          arch cards below yet, just here so it can be reviewed on its own
          before anything gets replaced. */}
      <section className="px-18 pb-16">
        <p className="mb-6 text-center font-mono text-[0.6875rem] tracking-[0.34em] text-muted">
          MEMBER CARD — PREVIEW
        </p>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-3">
          {COMMITTEE.slice(0, 3).map((m) => (
            <MemberCard key={m.name} member={m} />
          ))}
        </div>
      </section>

      <TeamRoad members={COMMITTEE} />

      <section className="px-18 pb-6 pt-10 text-center">
        <p className="font-mono text-[0.6875rem] tracking-[0.34em] text-muted">
          03 — BUILT BY
        </p>
        <h2 className="mt-4 font-display text-[clamp(1.5rem,3vw,2.5rem)] text-ink">
          The Developers
        </h2>
      </section>

      <TeamRoad members={DEVELOPERS} />
    </main>
  );
}
