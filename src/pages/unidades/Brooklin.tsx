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
  wazeUrl: "https://ul.waze.com/ul?place=ChIJjba-t6NQzpQRS5MDXzXan8Q&ll=-23.61710420%2C-46.67665820&navigate=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location",
  prestacaoUrl: "/NGHairBrooklin_prestacaocontas/",
};

const Brooklin = () => <UnidadePage unidade={data} />;
export default Brooklin;