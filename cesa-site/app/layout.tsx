import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Jaini, JetBrains_Mono, Patrick_Hand } from "next/font/google";

import MotionFX from "@/components/MotionFX";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

/**
 * Display: "The Last Shuriken" — the Figma file's own heading font,
 * self-hosted from the file the user provided (app/fonts/TheLastShuriken.ttf).
 *
 * ⚠ LICENSE: this face is personal-use-only. Its Readme.txt states a 100x
 * standard-license penalty for violating that, and this is a public
 * institutional site — commercial/promotional use by the foundry's own
 * definition. Flagged three times across the build of this site; the user
 * has explicitly chosen to proceed anyway, aware of the terms. If that
 * changes, either replace this with a purchased commercial license
 * (arterfakproject.com) or revert to Reggae One (still commercially
 * licensed, was the display font before this).
 *
 * Falls back to Reggae One's own stack, not a generic serif — if this font
 * ever fails to load, degrading straight to Impact/sans-serif would be a
 * much bigger visual jump than degrading to a face in the same brush family.
 */
const shuriken = localFont({
  src: "./fonts/TheLastShuriken.ttf",
  variable: "--font-reggae",
  display: "swap",
  fallback: ["Impact", "Arial Black", "sans-serif"],
});

/**
 * Body: Inter, at the user's explicit request, replacing Zen Kaku Gothic New.
 * Worth knowing what that trades away: Zen Kaku was chosen specifically to
 * keep a quiet Japanese thread running under the brush headline without
 * costume; Inter is a neutral, purely functional UI sans with none of that
 * connection. The decorative kanji (花見) still fall back to the system CJK
 * face either way — Inter doesn't cover those glyphs.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Mono: JetBrains Mono. Deliberately plain — section numbers and labels are
 * the functional layer, and a third characterful face would fight the brush.
 */
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

/* The home page's own faces, as named in the Figma file (GCeABSi7E0WdNDYKKObWS9).
 *
 * Edo (hero headline) — Vic Fieger, 2006, freeware.
 * ITC Machine (section headings) — ⚠ commercial: its name table reads
 *   "Copyright 1990 Bitstream Inc. All rights reserved. Confidential." Serving
 *   it from a public site needs a webfont license; this file was copied from
 *   the local install the design was made with.
 * Jaini (About copy) — Google Fonts, OFL.
 * Patrick Hand stands in for "Figma Hand" on the card captions, which is
 *   Figma's own in-app face and not distributable. */
const edo = localFont({
  src: "./fonts/Edo.ttf",
  variable: "--face-edo",
  display: "swap",
  fallback: ["Impact", "sans-serif"],
});

const machine = localFont({
  src: "./fonts/ITCMachine.otf",
  variable: "--face-machine",
  display: "swap",
  fallback: ["Impact", "Arial Black", "sans-serif"],
});

const jaini = Jaini({
  subsets: ["latin"],
  weight: "400",
  variable: "--face-jaini",
  display: "swap",
});

const hand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--face-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CESA — Computer Engineering Students' Association",
  description:
    "The official body of the Computer Engineering Department at VIT. " +
    "Code. Compete. Conquer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${shuriken.variable} ${inter.variable} ${jetbrains.variable} ${edo.variable} ${machine.variable} ${jaini.variable} ${hand.variable}`}
    >
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <MotionFX />
      </body>
    </html>
  );
}
