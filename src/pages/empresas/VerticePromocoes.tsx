import { Link } from "react-router-dom";
import { ArrowLeft, Gift, Sparkles, Calendar, Scissors, Droplets } from "lucide-react";
import { useVerticeAuth } from "@/hooks/useVerticeAuth";

const promotions = [
  {
    title: "Serviços de cabelo",
    description: "Condição especial para colaboradores Vértice em serviços de cabelo.",
    badge: "Benefício Vértice",
    highlight: "20% de desconto",
    icon: Scissors,
  },
  {
    title: "Hidratação",
    description: "Uma condição especial para celebrar o mês de início da parceria NGHair × Vértice.",
    badge: "Mês de início da parceria",
    highlight: "R$ 130,00",
    icon: Droplets,
  },
];

const VerticePromocoes = () => {
  const { userId, checking } = useVerticeAuth();
  if (checking || !userId) return null;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl flex items-center justify-between py-6">
          <Link to="/empresas/vertice/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao portal
          </Link>
        </div>
      </header>

      <section className="container max-w-5xl py-12">
        <div className="flex items-center gap-3 mb-3">
          <Gift className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl text-foreground">Promoções Vértice</h1>
        </div>
        <p className="text-muted-foreground mb-10">
          Ofertas exclusivas para colaboradores da parceria NGHair × Vértice.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {promotions.map((promo) => (
            <div
              key={promo.title}
              className="border border-border rounded-2xl p-6 bg-card hover:border-primary transition-all flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <promo.icon className="h-4 w-4 text-accent" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {promo.badge}
                </span>
              </div>
              <h2 className="font-display text-xl text-foreground mb-2">{promo.title}</h2>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{promo.description}</p>
              <p className="text-lg font-semibold text-primary mb-4">{promo.highlight}</p>
              <Link
                to="/agendamento"
                className="text-sm text-center rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Agendar agora
              </Link>
            </div>
          ))}
        </div>

        <div className="border border-border rounded-2xl p-8 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">Calendário de promoções</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            As promoções são atualizadas mensalmente. Fique atento ao portal para não perder
            nenhuma oferta exclusiva Vértice. Para agendar, acesse a página de agendamento
            e escolha a unidade NGHair mais próxima.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/agendamento"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Agendar serviço
            </Link>
            <Link
              to="/empresas/vertice/precos"
              className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Ver tabela de preços
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default VerticePromocoes;
