import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import GallerySection from "@/components/GallerySection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import FooterSection from "@/components/FooterSection";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <section id="galeria">
        <GallerySection />
      </section>
      <section id="depoimentos">
        <TestimonialsSection />
      </section>
      <CTASection />
      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
};

export default Index;
