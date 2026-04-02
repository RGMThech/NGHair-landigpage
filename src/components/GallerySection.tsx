import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Fallback images (used when DB is empty)
import galleryNails from "@/assets/gallery-nails.jpg";
import galleryMakeup from "@/assets/gallery-makeup.jpg";
import galleryProducts from "@/assets/gallery-products.jpg";
import heroSalon from "@/assets/hero-salon.jpg";

const fallbackImages = [
  { image_url: heroSalon, alt_text: "Interior do salão" },
  { image_url: galleryNails, alt_text: "Manicure profissional" },
  { image_url: galleryMakeup, alt_text: "Maquiagem profissional" },
  { image_url: galleryProducts, alt_text: "Produtos premium" },
];

type GalleryImage = { id: string; image_url: string; alt_text: string };

const GallerySection = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
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

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("gallery_images")
        .select("id, image_url, alt_text")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (data && data.length > 0) {
        setImages(data);
      } else {
        setImages(fallbackImages.map((img, i) => ({ ...img, id: `fallback-${i}` })));
      }
    };
    fetchImages();
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

        <div className={`${visible ? "animate-fade-up" : "opacity-0"}`}>
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {images.map((img) => (
                <CarouselItem key={img.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src={img.image_url}
                      alt={img.alt_text}
                      loading="lazy"
                      className="h-80 w-full object-cover image-zoom"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>

          {/* Mobile dots indicator */}
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            {images.slice(0, 5).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/30" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
