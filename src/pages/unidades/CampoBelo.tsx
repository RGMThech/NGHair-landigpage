import UnidadePage, { UnidadeData } from "./UnidadePage";
import heroSalon from "@/assets/hero-salon.jpg";
import galleryNails from "@/assets/gallery-nails.jpg";
import galleryMakeup from "@/assets/gallery-makeup.jpg";
import galleryProducts from "@/assets/gallery-products.jpg";

const data: UnidadeData = {
  nome: "Campo Belo",
  bairro: "Campo Belo",
  endereco: "Rua João Alvares Soares, 1292",
  cidade: "São Paulo - SP",
  telefone: "(11) 94796-2201",
  horarios: [
    { dia: "Segunda", horario: "Fechado" },
    { dia: "Ter a Sex", horario: "9h – 19h" },
    { dia: "Sábado", horario: "9h – 18h" },
    { dia: "Domingo", horario: "Fechado" },
  ],
  agendamentoUrl: "/agendamento",
  fotos: [
    { url: heroSalon, alt: "Interior do salão Campo Belo" },
    { url: galleryNails, alt: "Manicure" },
    { url: galleryMakeup, alt: "Maquiagem" },
    { url: galleryProducts, alt: "Produtos" },
  ],
  lat: -23.6225,
  lng: -46.6736,
  enderecoCompleto: "Rua João Alvares Soares, 1292 - Campo Belo, São Paulo - SP",
  wazeUrl: "https://ul.waze.com/ul?ll=-23.62187100%2C-46.67170300&navigate=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location",
};

const CampoBelo = () => <UnidadePage unidade={data} />;
export default CampoBelo;