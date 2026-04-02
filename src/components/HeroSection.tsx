import heroImage from "@/assets/hero-salon.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background image with Ken Burns */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Salão de beleza luxuoso"
          width={1920}
          height={1080}
          className="h-full w-full object-cover animate-ken-burns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-dark/60 via-warm-dark/30 to-warm-dark/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="animate-fade-up font-body text-sm uppercase tracking-[0.3em] text-cream/80 mb-6">
          Beleza · Elegância · Transformação
        </p>
        <h1 className="animate-fade-up-delay-1 font-display text-5xl md:text-7xl lg:text-8xl font-medium text-cream leading-tight max-w-4xl">
          Onde a <span className="italic text-gradient-gold">beleza</span> ganha vida
        </h1>
        <p className="animate-fade-up-delay-2 mt-6 max-w-xl font-body text-lg text-cream/75 font-light leading-relaxed">
          Uma experiência única de cuidado pessoal em um ambiente sofisticado e acolhedor
        </p>
        <div className="animate-fade-up-delay-3 mt-10 flex flex-col sm:flex-row gap-4">
          <a
            href="https://wa.me/5511947962201?text=Olá! Gostaria de agendar um horário"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-whatsapp px-8 py-4 font-body text-sm font-semibold text-cream uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-whatsapp/30"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Agende pelo WhatsApp
          </a>
          <a
            href="https://www.instagram.com/nghair01/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] px-8 py-4 font-body text-sm font-semibold text-cream uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#E1306C]/30"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Siga no Instagram
          </a>
          <a
            href="https://www.trinks.com/nghair/framebusca?rwg_token=AFd1xnGhS4dEqFta6HGjCtw2CLGeW_7ZBFBo3-oeBEQ0d7Wwd8yXl867b1PBWoqP6eLxRYFb99odxSXP2hV3mESCDN4M4YUtFA%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-body text-sm font-semibold text-primary-foreground uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
          >
            Agendar
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="h-12 w-7 rounded-full border-2 border-cream/40 flex items-start justify-center pt-2">
          <div className="h-2 w-1 rounded-full bg-cream/60 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
