import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleReview {
  name: string;
  text: string;
  rating: number;
  time: string;
  profilePhoto: string;
}

const fallbackTestimonials = [
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
  const ref = useRef<HTMLDivElement>(null);

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
      <div className="container max-w-6xl" ref={ref}>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayReviews.slice(0, 6).map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className={`hover-lift rounded-2xl bg-card p-8 border border-border/50 ${
                visible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <p className="font-body text-foreground/80 leading-relaxed mb-6 italic">"{t.text}"</p>
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
