import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Início", href: "#" },
  { label: "Serviços", href: "#servicos" },
  { label: "Galeria", href: "#galeria" },
  { label: "Depoimentos", href: "#depoimentos" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? "bg-background/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-6"
      }`}
    >
      <div className="container max-w-6xl flex items-center justify-between">
        <a href="#" className={`font-display text-2xl font-medium transition-colors duration-300 ${scrolled ? "text-foreground" : "text-cream"}`}>
          NGHair
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`font-body text-sm uppercase tracking-widest transition-colors duration-300 hover:text-primary ${
                scrolled ? "text-foreground/70" : "text-cream/80"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://www.trinks.com/nghair/framebusca?rwg_token=AFd1xnGhS4dEqFta6HGjCtw2CLGeW_7ZBFBo3-oeBEQ0d7Wwd8yXl867b1PBWoqP6eLxRYFb99odxSXP2hV3mESCDN4M4YUtFA%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-6 py-2.5 font-body text-xs font-semibold text-primary-foreground uppercase tracking-wider transition-all duration-300 hover:scale-105"
          >
            Agendar
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden transition-colors ${scrolled ? "text-foreground" : "text-cream"}`}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border p-6 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-body text-sm uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://www.trinks.com/nghair/framebusca?rwg_token=AFd1xnGhS4dEqFta6HGjCtw2CLGeW_7ZBFBo3-oeBEQ0d7Wwd8yXl867b1PBWoqP6eLxRYFb99odxSXP2hV3mESCDN4M4YUtFA%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-6 py-3 font-body text-xs font-semibold text-primary-foreground uppercase tracking-wider text-center"
          >
            Agendar
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
