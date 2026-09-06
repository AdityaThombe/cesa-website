import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost";

/**
 * The primary CTA is ink-on-cream, not accent-coloured: vermilion or sakura on
 * an amber sky fails contrast badly. Accents in this system decorate, they
 * never carry meaning on their own.
 *
 * Colours use the utilities Tailwind generates from the `--color-*` tokens in
 * @theme (text-washi, bg-ink). Never write the arbitrary form
 * text-[var(--color-washi)]: Tailwind cannot tell whether that var() is a
 * colour or a font size, so it drops the rule and the text silently inherits
 * body ink — which is how this button first shipped as an unreadable dark pill.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-washi font-bold shadow-[0_18px_44px_-16px_rgba(42,26,46,0.7)] " +
    "hover:bg-torii hover:text-ink",
  ghost:
    "border border-washi/45 text-washi hover:border-washi hover:bg-washi/10",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: { variant?: Variant; children: ReactNode } & ComponentProps<"a">) {
  return (
    <a
      {...props}
      className={
        "inline-flex h-14 items-center gap-3 rounded-full px-8 text-[0.9375rem] " +
        "tracking-[0.04em] transition-colors duration-200 " +
        VARIANTS[variant] +
        " " +
        className
      }
    >
      {children}
    </a>
  );
}

export function ArrowRight() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}
