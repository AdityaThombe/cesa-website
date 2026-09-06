import ParallaxScene from "@/components/scene/ParallaxScene";
import PetalCanvas from "@/components/scene/PetalCanvas";
import Button, { ArrowRight } from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";

const NAV = ["Home", "About", "Events", "Team", "Blog"];

const STATS = [
  { figure: "06", label: "EVENTS THIS TENURE" },
  { figure: "06", label: "TEAMS, HEAD & CO-HEAD" },
  { figure: "01", label: "FLAGSHIP — PLETHORA" },
];

export default function Hero() {
  return (
    <ParallaxScene>
      <PetalCanvas />

      {/* Hanami — blossom viewing. Set vertically in the right margin.
          The kanji fall back to a system CJK face: pulling the Japanese subset
          of the display font would cost megabytes for two glyphs. */}
      <div
        aria-hidden="true"
        className="absolute right-14 top-[38%] hidden flex-col items-center gap-6 xl:flex"
      >
        <span className="h-28 w-px bg-gradient-to-b from-transparent to-washi/60" />
        <span
          className="font-display text-[1.375rem] tracking-[0.5em] text-washi/70"
          style={{ writingMode: "vertical-rl" }}
        >
          花見
        </span>
        <span className="h-28 w-px bg-gradient-to-b from-washi/60 to-transparent" />
      </div>

      {/* A single flex column owning the full height: header, copy, stat strip.
          The strip used to be absolutely positioned while the copy sat in flow,
          so on shorter viewports the buttons landed on top of it. Stacking them
          in one column makes that collision impossible at any height. */}
      <div className="relative flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between px-18 pt-9">
          <Logo />
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.map((item, i) => (
              <a
                key={item}
                href="#"
                className={
                  "text-sm tracking-[0.06em] transition-opacity hover:opacity-100 " +
                  (i === 0 ? "text-washi" : "text-washi opacity-75")
                }
              >
                {item}
              </a>
            ))}
            <Button variant="ghost" href="#" className="h-11 px-6 text-sm">
              Join CESA
            </Button>
          </nav>
        </header>

        {/* Takes the slack, so the copy stays optically centred and the space
            between header and strip is never left empty. */}
        <div className="flex min-h-0 flex-1 flex-col justify-center px-18 py-8">
          <p className="mb-7 flex items-center gap-3.5 font-mono text-[0.6875rem] tracking-[0.34em] text-washi">
            <span className="inline-block h-px w-9 bg-current" />
            COMPUTER ENGINEERING STUDENTS&rsquo; ASSOCIATION
          </p>

          {/* Reggae One is very heavy and fairly wide, so this sits smaller and
              tighter than the brush script it replaced, with leading close to 1
              — thick strokes stack better than thin ones. */}
          <h1 className="max-w-[60rem] font-display text-[clamp(2.25rem,6.2vw,5.5rem)] font-normal leading-[1.02] tracking-[-0.015em] text-washi">
            <span className="block">Code.</span>
            <span className="block pl-[6%]">Compete.</span>
            <span className="block pl-[13%]">
              <span className="bg-gradient-to-r from-[#ffe3ef] via-sakura to-sky-horizon bg-clip-text text-transparent">
                Conquer.
              </span>
            </span>
          </h1>

          <p className="mt-8 max-w-[32rem] text-lg font-light leading-[1.75] text-washi/90">
            The official body of the Computer Engineering Department at VIT — a place
            to build things that work, ship them in public, and drag each other forward.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button href="#events">
              Explore Events
              <ArrowRight />
            </Button>
            <Button variant="ghost" href="#team">
              Meet the Committee
            </Button>
          </div>
        </div>

        {/* Sits over the empty paved courtyard — the one part of the scene with
            room for it. */}
        <div className="mx-18 hidden shrink-0 grid-cols-3 border-t border-washi/25 md:grid">
          {STATS.map(({ figure, label }, i) => (
            <div
              key={label}
              className={
                "flex items-baseline gap-4 py-6 " +
                (i > 0 ? "border-l border-washi/25 pl-10" : "")
              }
            >
              <span className="font-display text-[2.25rem] leading-none text-washi">
                {figure}
              </span>
              <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-washi/75">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ParallaxScene>
  );
}
