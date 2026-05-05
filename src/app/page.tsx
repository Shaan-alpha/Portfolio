import CanvasScrollSequence from "@/components/CanvasScrollSequence";
import ThemeToggle from "@/components/ThemeToggle";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Certifications from "@/components/Certifications";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div id="home" className="absolute top-0 left-0 w-full h-screen pointer-events-none" />
      <ThemeToggle />
      
      {/* 
        The canvas is sticky and stays in the background.
        It takes up 500vh, meaning the user scrolls for 5 screens 
        before the canvas un-sticks or content flows over it.
      */}
      <CanvasScrollSequence>
        <Hero />
      </CanvasScrollSequence>

      {/* 
        Navbar sticks to top
      */}
      <Navbar />
      
      <div className="relative bg-background">
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Certifications />
        <Contact />
        <Footer />
      </div>

    </main>
  );
}
