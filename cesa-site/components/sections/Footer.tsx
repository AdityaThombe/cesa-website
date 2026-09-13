import TornStrip from "@/components/ui/TornStrip";

const vw = (px: number) => `${(px / 19.2).toFixed(4)}vw`;

const box = (x: number, y: number, w: number, h: number) => ({
  left: vw(x),
  top: vw(y),
  width: vw(w),
  height: vw(h),
});

/**
 * Social row. LinkedIn and YouTube are the addresses in
 * CESA-CONTENT-REFERENCE.md; no GitHub or Discord address exists anywhere in
 * the project yet, so those two are placeholders to fill in.
 */
const SOCIALS = [
  { name: "LinkedIn", icon: "icon-linkedin", href: "https://www.linkedin.com/company/cesa-vit/", at: box(743, 344, 71, 71) },
  { name: "GitHub", icon: "icon-github", href: "#", at: box(866, 340, 72, 72) },
  { name: "YouTube", icon: "icon-youtube", href: "https://www.youtube.com/@cesavit153", at: box(960, 309, 143, 143) },
  { name: "Discord", icon: "icon-discord", href: "#", at: box(1125, 349, 99, 63) },
];

/**
 * Figma "Footer" group (44:34). Frame origin is the sky image's top at y3285.
 * The design frame ends at y4020, 735px down, and clips the dark end strip —
 * so does this section.
 */
export default function Footer() {
  return (
    <footer className="relative text-white" style={{ height: vw(735), zIndex: 3, overflowX: "clip" }}>
      <div className="absolute overflow-hidden" style={box(0, 0, 1920, 614)}>
        <picture>
          <source srcSet="/home/footer-sky.avif" type="image/avif" />
          <img
            src="/home/footer-sky.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute max-w-none"
            style={{ left: "-0.04%", top: 0, width: "100.08%", height: "104.56%" }}
          />
        </picture>
      </div>

      {/* Both silhouette groups are crops of the same students plate. */}
      {[
        { at: box(59, 238, 533, 376), crop: { left: "8.5%", top: "0.1%", width: "211.92%", height: "100%" } },
        { at: box(1268, 230, 578, 384), crop: { left: "-81.36%", top: "3.24%", width: "186.52%", height: "93.52%" } },
      ].map((s, i) => (
        <div key={i} aria-hidden="true" className="pointer-events-none absolute overflow-hidden" style={s.at}>
          <picture>
            <source srcSet="/home/students.avif" type="image/avif" />
            <img src="/home/students.webp" alt="" loading="lazy" className="absolute max-w-none" style={s.crop} />
          </picture>
        </div>
      ))}

      {/* Transition-3 (41:59): the 79px strip, drawn at the smaller art scale. */}
      <TornStrip y={-40} h={79} artH={405.2} artTop={-23.1} flip />

      {/* Footer end (54:116). Clipped at the frame's bottom edge, which cuts
          the strip, and the logo's transparent padding, where Figma does. */}
      <div className="absolute overflow-hidden" style={box(-152, 446, 2172, 289)}>
        <picture>
          <source srcSet="/home/footer-end.avif" type="image/avif" />
          <img
            src="/home/footer-end.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute left-0 top-0 max-w-none"
            style={{ width: "100%", height: vw(724) }}
          />
        </picture>
        <picture>
          <source srcSet="/home/logo-footer.avif" type="image/avif" />
          <img src="/home/logo-footer.webp" alt="CESA" loading="lazy" className="absolute" style={box(162, 147, 210, 189)} />
        </picture>
        <p className="absolute whitespace-nowrap font-body" style={{ left: vw(601), top: vw(204), fontSize: `max(10px, ${vw(30)})` }}>
          &copy; 2026 Computer Engineering Student Association - VIT. All rights reserved.
        </p>
      </div>

      <h2 className="absolute inset-x-0 text-center font-machine font-normal leading-none" style={{ top: vw(70), fontSize: vw(96) }}>
        Contact
      </h2>
      <p className="absolute inset-x-0 text-center font-segoe" style={{ top: vw(190), fontSize: `max(12px, ${vw(40)})` }}>
        Email:{" "}
        <a href="mailto:cesa.vidyalankar@gmail.com" className="underline-offset-4 hover:underline">
          cesa.vidyalankar@gmail.com
        </a>
      </p>
      <p className="absolute inset-x-0 text-center font-body" style={{ top: vw(264), fontSize: `max(10px, ${vw(29)})` }}>
        Location: Vidyalankar Institute of Technology, Wadala, Mumbai
      </p>

      <div
        aria-hidden="true"
        className="absolute bg-[rgba(240,211,211,0.47)] backdrop-blur-[2px]"
        style={{ ...box(713, 331, 514, 98), borderRadius: vw(21) }}
      />
      {SOCIALS.map((s, i) => (
        <a
          key={s.name}
          href={s.href}
          aria-label={s.name}
          target={s.href.startsWith("http") ? "_blank" : undefined}
          rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="absolute block transition-transform duration-200 hover:-translate-y-[3px]"
          style={s.at}
        >
          {/* Bob on an inner span: the link itself owns the hover lift. */}
          <span
            className="idle-bob block h-full w-full"
            style={{ ["--dur" as string]: "3.8s", ["--delay" as string]: `${-i * 0.6}s` }}
          >
            <picture>
              <source srcSet={`/home/${s.icon}.avif`} type="image/avif" />
              <img src={`/home/${s.icon}.webp`} alt="" loading="lazy" className="h-full w-full object-contain" />
            </picture>
          </span>
        </a>
      ))}
    </footer>
  );
}
