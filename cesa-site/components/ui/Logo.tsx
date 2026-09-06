/**
 * Placeholder mark — a blossom in a ring. Replace with the real CESA logo when
 * the committee supplies the SVG; the lockup around it stays.
 */
export function BlossomMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle
        cx="20"
        cy="20"
        r="18.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.6"
      />
      <g fill="currentColor">
        <ellipse cx="20" cy="11.5" rx="4.1" ry="6.2" />
        <ellipse cx="20" cy="28.5" rx="4.1" ry="6.2" />
        <ellipse cx="11.5" cy="20" rx="6.2" ry="4.1" />
        <ellipse cx="28.5" cy="20" rx="6.2" ry="4.1" />
      </g>
      <circle cx="20" cy="20" r="2.6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export default function Logo() {
  return (
    <a href="/" className="flex items-center gap-3.5 text-washi">
      <BlossomMark />
      <span className="flex flex-col gap-px">
        <span className="font-display text-[1.1875rem] tracking-[0.26em]">CESA</span>
        <span className="font-mono text-[0.5625rem] tracking-[0.22em] opacity-70">
          VIT · COMP ENGG
        </span>
      </span>
    </a>
  );
}
