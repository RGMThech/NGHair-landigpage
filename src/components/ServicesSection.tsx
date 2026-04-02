import { Scissors, Sparkles, Palette, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const services = [
  {
    icon: Scissors,
    title: "Corte & Styling",
    description: "Cortes modernos e clássicos com os melhores profissionais do mercado",
    price: "",
  },
  {
    icon: Palette,
    title: "Coloração",
    description: "Técnicas exclusivas de coloração, mechas e balayage para realçar sua beleza",
    price: "",
  },
  {
    icon: Sparkles,
    title: "Tratamentos Capilares",
    description: "Hidratação profunda, reconstrução e selagem para cabelos saudáveis e brilhantes",
    price: "",
  },
  {
    icon: Heart,
    title: "Manicure & Pedicure",
    description: "Unhas perfeitas com esmaltação em gel, nail art e cuidados completos",
    price: "",
  },
];

const ServicesSection = () => {
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
    <section id="servicos" className="py-24 lg:py-32 bg-background">
      <div className="container max-w-6xl" ref={ref}>
        <div className="text-center mb-16">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Nossos Serviços
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium text-foreground">
            Cuidados que <span className="italic text-primary">transformam</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`group hover-lift rounded-2xl bg-card p-8 border border-border/50 cursor-pointer ${
                visible ? `animate-fade-up` : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-medium text-foreground mb-3">{service.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
              <p className="font-body text-sm font-semibold text-accent">{service.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
