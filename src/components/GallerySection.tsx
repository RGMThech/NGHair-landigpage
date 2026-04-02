import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import galleryNails from "@/assets/gallery-nails.jpg";
import galleryMakeup from "@/assets/gallery-makeup.jpg";
import galleryProducts from "@/assets/gallery-products.jpg";
import heroSalon from "@/assets/hero-salon.jpg";
import { ChevronLeft, ChevronRight } from "lucide-react";

const fallbackImages = [
  { image_url: heroSalon, alt_text: "Interior do salão" },
  { image_url: galleryNails, alt_text: "Manicure profissional" },
  { image_url: galleryMakeup, alt_text: "Maquiagem profissional" },
  { image_url: galleryProducts, alt_text: "Produtos premium" },
];

type GalleryImage = { id: string; image_url: string; alt_text: string };

// Layout pattern: repeats every 5 images
// Page 1: 1 large (2x2), 2 small, 1 wide (2x1)
// Page 2: same pattern shifted
const spanPattern = [
  "md:col-span-2 md:row-span-2",
  "",
  "",
  "md:col-span-2",
  "",
];

const GallerySection = () => {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(allImages.length / PAGE_SIZE));
  const currentImages = allImages.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("gallery_images")
        .select("id, image_url, alt_text")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (data && data.length > 0) {
        setAllImages(data);
      } else {
        setAllImages(fallbackImages.map((img, i) => ({ ...img, id: `fallback-${i}` })));
      }
    };
    fetchImages();
  }, []);

  const prev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const next = () => setPage((p) => (p + 1) % totalPages);

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
          {currentImages.map((img, i) => (
            <div
              key={img.id}
              className={`overflow-hidden rounded-2xl ${spanPattern[i % spanPattern.length]} ${
                visible ? "animate-scale-in" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <img
                src={img.image_url}
                alt={img.alt_text}
                loading="lazy"
                className="h-full w-full object-cover image-zoom aspect-square"
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === page ? "bg-primary" : "bg-primary/30"
                  }`}
                  aria-label={`Página ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
