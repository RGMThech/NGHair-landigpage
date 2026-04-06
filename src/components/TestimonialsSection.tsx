import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";

interface GoogleReview {
  name: string;
  text: string;
  rating: number;
  time: string;
  profilePhoto: string;
}

const fallbackTestimonials: GoogleReview[] = [
  {
    name: "Ana Paula S.",
    text: "Melhor salão que já fui! Profissionais incríveis e o ambiente é simplesmente maravilhoso. Meu cabelo nunca ficou tão bonito.",
    rating: 5,
    time: "",
    profilePhoto: "",
  },
  {
    name: "Mariana L.",
    text: "A experiência é completa — desde o atendimento até o resultado final. Me sinto uma celebridade toda vez que venho aqui.",
    rating: 5,
    time: "",
    profilePhoto: "",
  },
  {
    name: "Camila R.",
    text: "As unhas ficaram perfeitas! Trabalho impecável com atenção a cada detalhe. Super recomendo para quem busca qualidade.",
    rating: 5,
    time: "",
    profilePhoto: "",
  },
];

const TestimonialsSection = () => {
  const [visible, setVisible] = useState(false);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 }
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("google-reviews");
        if (error) throw error;
        if (data?.reviews?.length) {
          setReviews(data.reviews);
          setOverallRating(data.rating);
          setTotalReviews(data.totalReviews);
        } else {
          setReviews(fallbackTestimonials);
        }
      } catch (err) {
        console.error("Failed to fetch Google reviews:", err);
        setReviews(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const displayReviews = reviews.length > 0 ? reviews : fallbackTestimonials;

  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container max-w-6xl" ref={sectionRef}>
        <div className="text-center mb-16">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Depoimentos
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium text-foreground">
            O que dizem <span className="italic text-primary">nossas clientes</span>
          </h2>
          {overallRating && totalReviews && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(overallRating) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <span className="font-display text-lg font-medium text-foreground">{overallRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({totalReviews} avaliações no Google)</span>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div className={`relative ${visible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {displayReviews.map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4"
                >
                  <div className="rounded-2xl bg-card p-8 border border-border/50 h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`h-4 w-4 ${j < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                    <p className="font-body text-foreground/80 leading-relaxed mb-6 italic flex-1">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      {t.profilePhoto && (
                        <img
                          src={t.profilePhoto}
                          alt={t.name}
                          className="h-10 w-10 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <p className="font-display text-base font-medium text-foreground">{t.name}</p>
                        {t.time && (
                          <p className="font-body text-xs text-muted-foreground mt-1">{t.time}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="absolute -left-4 lg:-left-12 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card border border-border/50 flex items-center justify-center text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            className="absolute -right-4 lg:-right-12 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card border border-border/50 flex items-center justify-center text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
