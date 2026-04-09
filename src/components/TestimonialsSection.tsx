import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleReview {
  name: string;
  text: string;
  rating: number;
  time: string;
  profilePhoto: string;
}

const TestimonialsSection = () => {
  const [visible, setVisible] = useState(false);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
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
        }
      } catch (err) {
        console.error("Failed to fetch Google reviews:", err);
        // Fallback: fetch directly from database
        try {
          const { data: cached } = await supabase
            .from("google_reviews")
            .select("*")
            .order("rating", { ascending: false });
          if (cached?.length) {
            setReviews(cached.map((r) => ({
              name: r.author_name,
              text: r.review_text,
              rating: r.rating,
              time: r.relative_time || "",
              profilePhoto: r.profile_photo_url || "",
            })));
          }
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Number of visible cards based on screen size
  const getVisibleCount = useCallback(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }, []);

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [getVisibleCount]);

  const maxIndex = Math.max(0, reviews.length - visibleCount);

  const goNext = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  const goPrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  // Auto-scroll
  useEffect(() => {
    if (reviews.length <= visibleCount) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length, visibleCount, maxIndex]);

  if (isLoading) return null;
  if (reviews.length === 0) return null;

  return (
    <section className="py-24 lg:py-32 bg-background overflow-hidden">
      <div className="container max-w-6xl" ref={ref}>
        {/* Header */}
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
        <div className="relative">
          {/* Navigation buttons */}
          {reviews.length > visibleCount && (
            <>
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border/50 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-card/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex >= maxIndex}
                className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border/50 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-card/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="overflow-hidden" ref={carouselRef}>
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              }}
            >
              {reviews.map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <div
                    className="rounded-2xl bg-card p-8 border border-border/50 flex flex-col justify-between h-full min-h-[280px]"
                  >
                    <div>
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={`h-4 w-4 ${j < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                      <p className="font-body text-sm text-foreground/80 leading-relaxed mb-6 italic line-clamp-6">
                        "{t.text}"
                      </p>
                    </div>
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

          {/* Dots indicator */}
          {reviews.length > visibleCount && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                  }`}
                  aria-label={`Ir para slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA to Google */}
        <div className="text-center mt-12">
          <a
            href="https://search.google.com/local/reviews?placeid=ChIJESZwFZ5QzpQRYl4wRxkKvqo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Ver todas as avaliações no Google
          </a>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
