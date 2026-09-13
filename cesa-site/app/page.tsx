import About from "@/components/sections/About";
import Events from "@/components/sections/Events";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";

/**
 * Home — Figma "CESA" file, Frame 1 (node 9:26): hero, About, Events &
 * Projects, Contact footer. The committee walk lives on /team.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Events />
      <Footer />
    </main>
  );
}
