import type { Metadata } from "next";
import { JetBrains_Mono, Reggae_One, Zen_Kaku_Gothic_New } from "next/font/google";

import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

/**
 * Display: Reggae One. Thick brush-derived strokes with ragged, chiselled
 * edges — the closest thing on Google Fonts to Edo, and unlike Edo it is
 * licensed for commercial use, which matters for an institutional site.
 *
 * One weight (400), which is already very heavy. Brush faces have no bold;
 * synthesising one would clog the counters and kill the stroke texture.
 */
const reggae = Reggae_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-reggae",
  display: "swap",
});

/**
 * Body: Zen Kaku Gothic New. Quiet enough to let the brush headline carry the
 * page, and it keeps the Japanese thread without costume.
 * Latin subset only — the decorative kanji (花見) fall back to the system CJK
 * face rather than pulling megabytes for three glyphs.
 */
const zen = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-zen",
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
      className={`${reggae.variable} ${zen.variable} ${jetbrains.variable}`}
    >
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
