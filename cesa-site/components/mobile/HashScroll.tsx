"use client";

import { useEffect } from "react";

/**
 * Section links on the phone layout.
 *
 * The desktop sections own the real #about / #events ids, so on a phone a
 * hash has nowhere to land — the element carrying the id is hidden. This finds
 * the visible `[data-anchor]` for a hash instead: on load (arriving from
 * another page at /#about) and when an in-page section link is tapped.
 */
export function scrollToAnchor(name: string, smooth = true) {
  const target = Array.from(document.querySelectorAll<HTMLElement>(`[data-anchor="${name}"]`)).find(
    // offsetParent is null for anything inside a display:none layout.
    (el) => el.offsetParent !== null,
  );
  if (!target) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: smooth && !reduced ? "smooth" : "auto" });
  return true;
}

export default function HashScroll() {
  useEffect(() => {
    const fromHash = () => {
      const name = decodeURIComponent(window.location.hash.slice(1));
      if (name) scrollToAnchor(name, false);
    };
    // After layout and images have had a frame to settle.
    const t = window.setTimeout(fromHash, 60);

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href*='#']");
      // The menu handles its own links: it has to close before the page can move.
      if (!link || link.closest('[role="dialog"]')) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      if (scrollToAnchor(decodeURIComponent(url.hash.slice(1)))) {
        e.preventDefault();
        history.replaceState(null, "", url.hash);
      }
    };
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", fromHash);
    };
  }, []);

  return null;
}
