import About from "@/components/sections/About";
import Events from "@/components/sections/Events";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import MobileHome from "@/components/mobile/MobileHome";
import MobileNav from "@/components/mobile/MobileNav";

/**
 * Home — Figma "CESA" file. Desktop is Frame 1 (node 9:26): hero, About,
 * Events & Projects, Contact footer. Phones get the iPhone frame (79:2).
 */
export default function Home() {
  return (
    <main>
      {/* Two layouts, one visible: the desktop frame from laptop width up,
          the phone frame (Figma 79:2) below it. */}
      <div className="hidden lg:block">
        <Hero />
        <About />
        <Events />
        <Footer />
      </div>
      <div className="relative lg:hidden">
        <div className="absolute inset-x-0 top-0 z-40">
          <MobileNav />
        </div>
        <MobileHome />
      </div>
    </main>
  );
}
