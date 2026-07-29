import { useState } from "react";
import { CalendarCheck, MapPin, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { reportConversion } from "@/lib/gtag";

const TRINKS_CAMPO_BELO =
  "https://www.trinks.com/nghaircampobelo/framebusca?rwg_token=AE37R_hFrCkB3xGrGpHrhZJ2eYyHY54URcGROVZMFpIubfjPV5MXtUaNLhW9chlpNtXLG97m0fFlkkv84R9PNn-IV-NI0eGIDg%3D%3D";

type Unidade = "campo-belo" | "brooklin";

const Agendamento = () => {
  const [unidade, setUnidade] = useState<Unidade | null>(null);

  const selecionar = (u: Unidade) => {
    setUnidade(u);
    if (u === "campo-belo") reportConversion();
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-warm-dark overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/20" />
        </div>
        <div className="container max-w-5xl relative text-center">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-accent mb-4">
            Agendamento online
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-medium text-cream mb-6">
            Escolha sua <span className="italic text-accent">unidade</span>
          </h1>
          <p className="font-body text-cream/70 max-w-xl mx-auto text-lg">
            Selecione o salão de sua preferência para agendar seu horário.
          </p>
        </div>
      </section>

      {/* Seleção de unidade */}
      <section className="py-14 lg:py-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                id: "campo-belo" as Unidade,
                nome: "Campo Belo",
                endereco: "Rua João Alvares Soares, 1292",
                status: "Agendamento online disponível",
              },
              {
                id: "brooklin" as Unidade,
                nome: "Brooklin",
                endereco: "Rua Barão do Triunfo, 1455",
                status: "Em breve disponível para agendamento online",
              },
            ].map((u) => (
              <button
                key={u.id}
                onClick={() => selecionar(u.id)}
                className={`text-left bg-card border rounded-2xl p-8 shadow-sm transition-all hover:-translate-y-1 ${
                  unidade === u.id
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border hover:border-primary"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Unidade
                    </p>
                    <p className="font-display text-2xl text-foreground">NGHair {u.nome}</p>
                    <p className="font-body text-sm text-muted-foreground mt-1">{u.endereco}</p>
                    <p className="font-body text-xs uppercase tracking-wider text-primary mt-3">
                      {u.status}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Resultado */}
          <div className="mt-10">
            {unidade === null && (
              <div className="text-center font-body text-sm text-muted-foreground flex items-center justify-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Selecione uma unidade acima para continuar.
              </div>
            )}

            {unidade === "campo-belo" && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-card">
                <iframe
                  title="Agendamento NGHair Campo Belo"
                  src={TRINKS_CAMPO_BELO}
                  width="100%"
                  height="900"
                  style={{ border: 0, minHeight: 900 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            {unidade === "brooklin" && (
              <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-sm">
                <div className="mx-auto mb-5 w-fit p-4 rounded-full bg-accent/10">
                  <Clock className="h-7 w-7 text-accent" />
                </div>
                <h2 className="font-display text-3xl text-foreground mb-3">
                  Em breve <span className="italic text-primary">disponível</span>
                </h2>
                <p className="font-body text-muted-foreground max-w-md mx-auto">
                  O agendamento online da unidade Brooklin estará disponível em breve.
                  Enquanto isso, fale com a gente pelo WhatsApp para marcar seu horário.
                </p>
                <a
                  href="https://wa.me/5511947962201?text=Olá! Gostaria de agendar um horário na unidade Brooklin"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={reportConversion}
                  className="mt-7 inline-block rounded-full bg-whatsapp px-8 py-3 font-body text-xs font-semibold text-cream uppercase tracking-wider transition-transform hover:scale-105"
                >
                  Agendar pelo WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
};

export default Agendamento;