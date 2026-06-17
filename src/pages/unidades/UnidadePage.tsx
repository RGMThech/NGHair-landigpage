import { MapPin, Phone, Clock, Navigation, Car, Footprints, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { reportConversion } from "@/lib/gtag";

export type UnidadeData = {
  nome: string;
  bairro: string;
  endereco: string;
  cidade: string;
  cep?: string;
  telefone: string;
  whatsapp?: string;
  horarios: { dia: string; horario: string }[];
  agendamentoUrl: string;
  instagram?: string;
  fotos: { url: string; alt: string }[];
  // Coordenadas para Waze e mapas
  lat: number;
  lng: number;
  // Texto exato usado nas URLs do Google Maps
  enderecoCompleto: string;
  wazeUrl?: string;
  prestacaoUrl?: string;
};

const UnidadePage = ({ unidade }: { unidade: UnidadeData }) => {
  const queryAddr = encodeURIComponent(unidade.enderecoCompleto);
  const mapsEmbed = `https://www.google.com/maps?q=${queryAddr}&output=embed`;
  const mapsDriving = `https://www.google.com/maps/dir/?api=1&destination=${queryAddr}&travelmode=driving`;
  const mapsWalking = `https://www.google.com/maps/dir/?api=1&destination=${queryAddr}&travelmode=walking`;
  const wazeUrl = unidade.wazeUrl || `https://waze.com/ul?ll=${unidade.lat},${unidade.lng}&navigate=yes`;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-warm-dark overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/20" />
        </div>
        <div className="container max-w-6xl relative">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-accent mb-4">
            Unidade
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-medium text-cream mb-6">
            NGHair <span className="italic text-accent">{unidade.nome}</span>
          </h1>
          <p className="font-body text-cream/70 max-w-xl text-lg">
            {unidade.endereco} — {unidade.bairro}, {unidade.cidade}
          </p>
        </div>
      </section>

      {/* Info + Mapa */}
      <section className="py-16 lg:py-24">
        <div className="container max-w-6xl grid lg:grid-cols-2 gap-10">
          {/* Cards de info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-1">Endereço</p>
                  <p className="font-display text-xl text-foreground">{unidade.endereco}</p>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {unidade.bairro} — {unidade.cidade}
                    {unidade.cep ? ` · ${unidade.cep}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-1">Telefone</p>
                  <p className="font-display text-xl text-foreground">{unidade.telefone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">Horário</p>
                  {unidade.horarios.map((h) => (
                    <div key={h.dia} className="flex justify-between gap-8 font-body text-sm py-1">
                      <span className="text-foreground/80">{h.dia}</span>
                      <span className="text-foreground font-medium">{h.horario}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Como chegar */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Como chegar
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a href={mapsDriving} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <Car className="h-6 w-6 text-primary" />
                  <span className="font-body text-xs uppercase tracking-wider">Carro</span>
                  <span className="font-body text-[10px] text-muted-foreground">Google Maps</span>
                </a>
                <a href={mapsWalking} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <Footprints className="h-6 w-6 text-primary" />
                  <span className="font-body text-xs uppercase tracking-wider">A pé</span>
                  <span className="font-body text-[10px] text-muted-foreground">Google Maps</span>
                </a>
                <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/10 transition-all">
                  <Navigation className="h-6 w-6 text-accent" />
                  <span className="font-body text-xs uppercase tracking-wider">Waze</span>
                  <span className="font-body text-[10px] text-muted-foreground">Abrir rota</span>
                </a>
              </div>

              <a
                href={unidade.agendamentoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={reportConversion}
                className="mt-6 block text-center rounded-full bg-primary px-6 py-3 font-body text-xs font-semibold text-primary-foreground uppercase tracking-wider hover:scale-[1.02] transition-transform"
              >
                Agendar nesta unidade
              </a>
            </div>
          </div>

          {/* Mapa */}
          <div className="rounded-2xl overflow-hidden border border-border shadow-lg min-h-[400px] lg:min-h-full">
            <iframe
              title={`Mapa NGHair ${unidade.nome}`}
              src={mapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 500 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* Galeria */}
      {unidade.fotos.length > 0 && (
        <section className="py-16 lg:py-24 bg-secondary/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
                Galeria
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground">
                Conheça o <span className="italic text-primary">espaço</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {unidade.fotos.map((f, i) => (
                <div
                  key={i}
                  className={`overflow-hidden rounded-2xl ${
                    i % 5 === 0 ? "md:col-span-2 md:row-span-2" : ""
                  }`}
                >
                  <img
                    src={f.url}
                    alt={f.alt}
                    loading="lazy"
                    className="h-full w-full object-cover aspect-square hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
};

export default UnidadePage;