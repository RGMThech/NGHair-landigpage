export interface VerticePriceItem {
  name: string;
  value: number;
}

export interface VerticePriceCategory {
  name: string;
  items: VerticePriceItem[];
}

const p = (name: string, value: number): VerticePriceItem => ({
  name,
  value,
});

export const verticePriceCategories: VerticePriceCategory[] = [
  {
    name: "Cabelo",
    items: [
      p("Lavagem", 50),
      p("Lavar e Secar", 70),
      p("Escova", 120),
      p("Corte Feminino", 242),
      p("Corte Feminino Franja", 64),
      p("Corte masculino", 110),
      p("Corte Máquina Masculino", 80),
      p("Prancha (adicional, qualquer tamanho)", 50),
      p("Coloração", 320),
      p("Luzes", 700),
      p("Luzes contorno", 590),
      p("Botox ou Progressiva", 390),
      p("Redutora sem formol", 420),
      p("Aplicação de coloração com produto do cliente", 198),
    ],
  },
  {
    name: "Unhas",
    items: [
      p("Manicure completa", 45),
      p("Pedicure completa", 50),
      p("Francesinha", 5),
      p("Esmaltação de mãos ou pés", 34),
    ],
  },
  {
    name: "Estética",
    items: [
      p("Axila", 44),
      p("Barriga", 59),
      p("Braços", 66),
      p("Buço (cera)", 39),
      p("Coloração de sobrancelha (Henna) - sem design", 60),
      p("Completa (1/2 perna + virilha íntima com nádegas)", 260),
      p("Completa (buço, axila, perna inteira, íntima)", 260),
      p("Costas", 110),
      p("Dedos dos pés ou mãos", 44),
      p("Meia perna", 90),
      p("Nádegas", 64),
      p("Perna inteira", 130),
      p("Queixo", 42),
      p("Rosto", 99),
      p("Rosto com cera hipoalergênica", 99),
      p("Tórax", 90),
      p("Virilha (1 serviço) simples", 72),
      p("Virilha Completa (3 serviços)", 109),
      p("Virilha Íntima (2 serviços)", 109),
    ],
  },
  {
    name: "Maquiagem",
    items: [
      p("Maquiagem", 280),
      p("Penteado", 220),
    ],
  },
];
