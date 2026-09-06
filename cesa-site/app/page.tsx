import Hero from "@/components/sections/Hero";

export default function Home() {
  return (
    <main>
      <Hero />

      {/* The torn paper edge that wipes up over the sunset. Sits at the top of
          the first cream section and overlaps the hero, so the tear reads as
          paper being laid over the scene rather than a band between two
          blocks. */}
      <section className="relative bg-washi">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-[7vw] h-[8vw] bg-[url('/scene/torn-edge.webp')] bg-[length:100%_100%] bg-bottom bg-no-repeat"
        />

        <div
          className="relative px-18 py-32"
          style={{
            backgroundImage: "url('/scene/washi-paper.webp')",
            backgroundSize: "512px",
            backgroundBlendMode: "multiply",
          }}
        >
          <p className="font-mono text-[0.6875rem] tracking-[0.34em] text-muted">
            01 — ABOUT
          </p>
          <h2 className="mt-6 max-w-[52rem] font-display text-[clamp(1.75rem,3.6vw,3.375rem)] font-semibold leading-[1.24] tracking-[-0.015em]">
            We turn a department into a{" "}
            <span className="text-sakura">community</span> — coding
            competitions, AI/ML challenges, workshops and hackathons that leave people
            with something they built.
          </h2>
          <p className="mt-9 max-w-[47rem] text-[1.0625rem] font-light leading-[1.9] text-muted">
            Our flagship, <strong className="font-medium text-ink">Plethora</strong>,
            brings all of it together under one roof each year. Guided by our motto —
            Code. Compete. Conquer. — we set out to shape the next generation of tech
            leaders, one shipped project at a time.
          </p>
        </div>
      </section>
    </main>
  );
}
