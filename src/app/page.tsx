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
import SectionDivider from "@/components/SectionDivider";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div id="home" className="absolute top-0 left-0 w-full h-screen pointer-events-none" />
      <ThemeToggle />

      <Hero />

      <Navbar />
      
      <div className="relative overflow-hidden">
        <About />
        <SectionDivider />
        <Skills />
        <SectionDivider />
        <Projects />
        <SectionDivider />
        <Experience />
        <Certifications />
        <SectionDivider />
        <Contact />
        <Footer />
      </div>

    </main>
  );
}
