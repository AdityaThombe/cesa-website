import ParallaxScene from "@/components/scene/ParallaxScene";
import PetalCanvas from "@/components/scene/PetalCanvas";
import SiteNav from "@/components/ui/SiteNav";

const vw = (px: number) => `${(px / 19.2).toFixed(4)}vw`;

/**
 * Figma "Home - Heading" group (node 54:115) plus the Explore button (54:104).
 *
 * The group is anchored at the frame's (128, 204); `top` is that y as a share
 * of the 1072px hero frame so it tracks the cover-fit plate vertically, and
 * everything inside is offset from the anchor in vw so the block keeps the
 * design's internal proportions at any width.
 */
export default function Hero() {
  return (
    <ParallaxScene>
      <PetalCanvas />

      <div className="relative h-full">
        <SiteNav />

        <div className="absolute" style={{ left: vw(128), top: "19.03%", width: vw(700) }}>
          <p
            className="font-segoe text-[#fbfbfb]"
            style={{ fontSize: `max(11px, ${vw(24)})`, letterSpacing: "0.02em" }}
          >
            COMPUTER ENGINEERING STUDENT&rsquo;S ASSOCIATION
          </p>

          {/* 3 lines in a 257px box -> 1.058 leading at 81px. */}
          <h1
            className="absolute left-0 font-edo font-normal leading-[1.058]"
            style={{ top: vw(54), fontSize: `max(1.75rem, ${vw(81)})` }}
          >
            <span className="block text-[#fbfbfb]">LEARN</span>
            <span className="block text-[#ffe500]">INNOVATE</span>
            <span className="block text-white">COLLABORATE</span>
          </h1>

          <div className="absolute left-0 flex items-center" style={{ top: vw(340), gap: vw(16) }}>
            <span
              aria-hidden="true"
              className="block bg-white"
              style={{ width: vw(66), height: "max(1px, 0.1042vw)", transform: "rotate(-0.87deg)" }}
            />
            <p
              className="font-segoe text-[#fbfbfb]"
              style={{ fontSize: `max(10px, ${vw(20)})`, letterSpacing: vw(2.4) }}
            >
              CODE. COMPETE. CONQUER
            </p>
          </div>

          <a
            href="#about"
            className="group absolute left-0 flex items-center justify-center font-segoe font-bold text-white transition-transform duration-200 ease-[var(--ease-entrance)] hover:-translate-y-[3px] active:translate-y-0"
            style={{ top: vw(393.08), width: vw(214.63), height: vw(103.25), minWidth: "108px", minHeight: "52px" }}
          >
            <span
              aria-hidden="true"
              className="art-pill-wide absolute inset-0 transition-[transform,filter] duration-200 ease-[var(--ease-entrance)] group-hover:scale-[1.05] group-hover:brightness-110 group-hover:saturate-125 group-hover:drop-shadow-[0_6px_14px_rgba(20,14,18,0.45)]"
            />
            <span className="relative whitespace-nowrap" style={{ fontSize: `max(15px, ${vw(34)})` }}>
              Explore &rarr;
            </span>
          </a>
        </div>
      </div>
    </ParallaxScene>
  );
}
