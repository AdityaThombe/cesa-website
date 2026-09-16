"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { scrollToAnchor } from "@/components/mobile/HashScroll";

/** The phone frame is 390px wide; everything here scales off it. */
const m = (px: number) => `${(px / 3.9).toFixed(4)}vw`;

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about" },
  { label: "Events", href: "/#events" },
  { label: "Memories", href: "/memories" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/#contact" },
];

/**
 * The phone nav bar (Figma 90:3 — torn strip, badge, menu icon) and the menu
 * it opens.
 *
 * The design only draws the closed bar, so the open menu is built from the
 * same materials: a washi sheet that slides in from the right, carrying the
 * desktop's paper pills, dealt in one after another.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  // Several pages can hold a copy of the nav (one per layout); ids must differ.
  const menuId = useId();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** A section to scroll to once the menu has closed and the page is free to move. */
  const pendingAnchor = useRef<string | null>(null);

  // Close on navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Keep focus inside the open menu.
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>("a, button"));
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      buttonRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  // Runs after the effect above has released the scroll lock.
  useEffect(() => {
    if (open || !pendingAnchor.current) return;
    const name = pendingAnchor.current;
    pendingAnchor.current = null;
    if (scrollToAnchor(name)) history.replaceState(null, "", `#${name}`);
  }, [open]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const [path, hash] = href.split("#");
    if (hash && (path || "/") === pathname) {
      e.preventDefault();
      // The page can't move while the menu holds the scroll lock; the effect
      // above picks this up once it has let go.
      pendingAnchor.current = hash;
      setOpen(false);
    }
  };

  return (
    <div className="lg:hidden">
      {/* Torn strip (79:3), flipped so the tear hangs down. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden" style={{ height: m(57) }}>
        <img
          src="/scene/torn-edge.webp"
          alt=""
          className="absolute left-0 w-full max-w-none"
          style={{ top: "-3.47%", height: "106.94%", transform: "scaleY(-1)" }}
        />
      </div>

      {/* Badge (79:5). */}
      <Link href="/" aria-label="CESA home" className="absolute z-20 block" style={{ left: m(-8), top: m(-16), width: m(110), height: m(99) }}>
        <picture>
          <source srcSet="/scene/logo-badge.avif" type="image/avif" />
          <img src="/scene/logo-badge.webp" alt="CESA" className="h-full w-full object-contain" />
        </picture>
      </Link>

      {/* Menu icon (79:7). The tap target is 44px; the glyph keeps its 24. */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(true)}
        className="absolute z-20 flex items-center justify-center rounded-full transition-transform duration-200 active:scale-90"
        style={{ right: `calc(${m(17)} - 10px)`, top: `calc(${m(10)} - 10px)`, width: `calc(${m(24)} + 20px)`, height: `calc(${m(24)} + 20px)` }}
      >
        <img src="/mobile/icon-menu.svg" alt="" aria-hidden="true" style={{ width: m(24), height: m(24) }} />
      </button>

      {/* ------------------------------------------------------------- menu */}
      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
        // Inert while closed, so nothing inside it takes focus or taps.
        {...(!open ? { inert: true } : {})}
      >
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-[rgba(20,12,24,0.55)] backdrop-blur-[2px] transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
        />

        <div
          ref={panelRef}
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`absolute inset-y-0 right-0 flex w-[82%] max-w-[420px] flex-col transition-transform duration-500 ease-[var(--ease-entrance)] ${
            open ? "translate-x-0" : "translate-x-[105%]"
          }`}
          style={{
            backgroundColor: "var(--color-washi)",
            backgroundImage: "url('/scene/washi-paper.webp')",
            backgroundSize: "cover",
            boxShadow: "-12px 0 40px -10px rgba(20,12,24,0.5)",
          }}
        >
          <div className="flex items-center justify-between px-6 pt-5">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-ink/55">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-transform duration-200 active:scale-90"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav aria-label="Primary" className="mt-6 flex flex-col gap-3 px-6">
            {LINKS.map((link, i) => {
              const current = link.href === pathname;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => go(e, link.href)}
                  aria-current={current ? "page" : undefined}
                  className="group relative flex h-[58px] items-center justify-center text-washi transition-[transform,opacity] duration-500 ease-[var(--ease-entrance)] active:scale-[0.97]"
                  style={{
                    transform: open ? "translateX(0) rotate(0deg)" : `translateX(40px) rotate(${i % 2 ? 2 : -2}deg)`,
                    opacity: open ? 1 : 0,
                    transitionDelay: open ? `${120 + i * 55}ms` : "0ms",
                  }}
                >
                  <picture>
                    <source srcSet="/scene/nav-pill.avif" type="image/avif" />
                    <img
                      src="/scene/nav-pill.webp"
                      alt=""
                      aria-hidden="true"
                      className={`absolute inset-0 h-full w-full object-fill transition-[filter] duration-200 group-active:brightness-110 ${current ? "saturate-150" : ""}`}
                    />
                  </picture>
                  <span className="relative font-segoe text-[1.2rem]">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <p className="mt-auto px-6 pb-8 font-hand text-[1.35rem] text-ink/70">Code. Compete. Conquer.</p>
        </div>
      </div>
    </div>
  );
}
