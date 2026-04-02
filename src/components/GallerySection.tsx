import { useEffect, useRef, useState } from "react";
import galleryNails from "@/assets/gallery-nails.jpg";
import galleryMakeup from "@/assets/gallery-makeup.jpg";
import galleryProducts from "@/assets/gallery-products.jpg";
import heroSalon from "@/assets/hero-salon.jpg";

const images = [
  { src: heroSalon, alt: "Interior do salão", span: "md:col-span-2 md:row-span-2" },
  { src: galleryNails, alt: "Manicure profissional", span: "" },
  { src: galleryMakeup, alt: "Maquiagem profissional", span: "" },
  { src: galleryProducts, alt: "Produtos premium", span: "md:col-span-2" },
];

const GallerySection = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="container max-w-6xl" ref={ref}>
        <div className="text-center mb-16">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Galeria
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium text-foreground">
            Nosso <span className="italic text-primary">trabalho</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div
              key={img.alt}
              className={`overflow-hidden rounded-2xl ${img.span} ${
                visible ? "animate-scale-in" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-full w-full object-cover image-zoom aspect-square"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
