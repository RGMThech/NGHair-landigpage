import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Ana Paula S.",
    text: "Melhor salão que já fui! Profissionais incríveis e o ambiente é simplesmente maravilhoso. Meu cabelo nunca ficou tão bonito.",
    rating: 5,
    service: "Coloração & Corte",
  },
  {
    name: "Mariana L.",
    text: "A experiência é completa — desde o atendimento até o resultado final. Me sinto uma celebridade toda vez que venho aqui.",
    rating: 5,
    service: "Tratamento Capilar",
  },
  {
    name: "Camila R.",
    text: "As unhas ficaram perfeitas! Trabalho impecável com atenção a cada detalhe. Super recomendo para quem busca qualidade.",
    rating: 5,
    service: "Manicure & Pedicure",
  },
];

const TestimonialsSection = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`hover-lift rounded-2xl bg-card p-8 border border-border/50 ${
                visible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="font-body text-foreground/80 leading-relaxed mb-6 italic">"{t.text}"</p>
              <div>
                <p className="font-display text-base font-medium text-foreground">{t.name}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">{t.service}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
