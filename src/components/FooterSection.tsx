import { MapPin, Phone, Clock, Instagram } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-warm-dark py-16">
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-display text-2xl font-medium text-cream mb-4">Belezza</h3>
            <p className="font-body text-sm text-cream/60 leading-relaxed">
              Transformando vidas através da beleza desde 2015. Venha viver essa experiência.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-cream/50 hover:text-accent transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-display text-base font-medium text-cream mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-cream/60">
                <Phone className="h-4 w-4 text-accent" />
                <span className="font-body text-sm">(11) 99999-9999</span>
              </div>
              <div className="flex items-center gap-3 text-cream/60">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="font-body text-sm">Rua da Beleza, 123 - São Paulo</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-display text-base font-medium text-cream mb-4">Horário</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-cream/60">
                <Clock className="h-4 w-4 text-accent" />
                <div className="font-body text-sm">
                  <p>Seg a Sex: 9h – 20h</p>
                  <p>Sábado: 9h – 18h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-cream/10 pt-8 text-center">
          <p className="font-body text-xs text-cream/40">© 2026 Belezza. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
