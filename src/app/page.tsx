import Header from "@/components/Header";
import Film from "@/components/film/Film";
import HeroScene from "@/components/film/HeroScene";
import ThesisScene from "@/components/film/ThesisScene";
import WorkScene from "@/components/film/WorkScene";
import CaseStudies from "@/components/CaseStudies";
import Archive from "@/components/Archive";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

/** The film (full-screen scenes, one per gesture) and then the reading part,
 *  which is one tall snap area scrolled natively. The footer stays outside
 *  main as the page's contentinfo landmark and snaps to its own end. */
export default function Home() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <div id="top" aria-hidden />
        <Film>
          <HeroScene />
          <ThesisScene />
          <WorkScene />
        </Film>
        <div id="reading" data-reading>
          <CaseStudies />
          <Archive />
          <About />
          <Experience />
          <Contact />
        </div>
      </main>
      <Footer />
    </>
  );
}
