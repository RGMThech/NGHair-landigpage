import UnidadePage, { UnidadeData } from "./UnidadePage";
import heroSalon from "@/assets/hero-salon.jpg";
import galleryNails from "@/assets/gallery-nails.jpg";
import galleryMakeup from "@/assets/gallery-makeup.jpg";
import galleryProducts from "@/assets/gallery-products.jpg";

const data: UnidadeData = {
  nome: "Brooklin",
  bairro: "Brooklin",
  endereco: "Rua Barão do Triunfo, 1455",
  cidade: "São Paulo - SP",
  telefone: "(11) 94796-2201",
  horarios: [
    { dia: "Segunda", horario: "Fechado" },
    { dia: "Ter a Sex", horario: "9h – 19h" },
    { dia: "Sábado", horario: "9h – 18h" },
    { dia: "Domingo", horario: "Fechado" },
  ],
  agendamentoUrl:
    "https://www.trinks.com/nghair/framebusca?rwg_token=AFd1xnGhS4dEqFta6HGjCtw2CLGeW_7ZBFBo3-oeBEQ0d7Wwd8yXl867b1PBWoqP6eLxRYFb99odxSXP2hV3mESCDN4M4YUtFA%3D%3D",
  fotos: [
    { url: heroSalon, alt: "Interior do salão Brooklin" },
    { url: galleryNails, alt: "Manicure" },
    { url: galleryMakeup, alt: "Maquiagem" },
    { url: galleryProducts, alt: "Produtos" },
  ],
  lat: -23.6105,
  lng: -46.6896,
  enderecoCompleto: "Rua Barão do Triunfo, 1455 - Brooklin, São Paulo - SP",
  wazeUrl: "https://waze.com/ul/h6gyc9ue5v",
};

const Brooklin = () => <UnidadePage unidade={data} />;
export default Brooklin;