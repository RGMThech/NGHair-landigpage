export interface VerticePriceItem {
  name: string;
  full: number;
  collaborator: number;
}

/** Desconto da parceria Vértice: 30% sobre o valor cheio. */
const discount = 0.7;
const p = (name: string, full: number): VerticePriceItem => ({
  name,
  full,
  collaborator: Math.round(full * discount * 100) / 100,
});

export const verticePrices: VerticePriceItem[] = [
  p("Manicure completa", 45),
  p("Pedicure completa", 50),
  p("Escova - cabelo longo", 120),
  p("Lavagem", 50),
  p("Virilha Completa (3 serviços)", 109),
  p("Completa (buço, axila, perna inteira, íntima)", 260),
  p("Corte Feminino", 242),
  p("Corte masculino", 110),
  p("Manicure masculino", 46),
  p("Secar", 72),
  p("Axila - F", 44),
  p("Axila - M", 44),
  p("Pedicure Francesinha", 54),
  p("Buço (cera)", 39),
  p("Meia perna F", 90),
  p("Meia perna M", 110),
  p("Esmaltação Francesinha Decorada (adicional)", 38),
  p("Esmaltação dos pés", 34),
  p("Escova - cabelo médio (nível dos ombros)", 100),
  p("Lavar e Secar", 70),
  p("Escova - cabelo curto", 96),
  p("Virilha (1 serviço) simples", 72),
  p("Perna inteira F", 130),
  p("Perna inteira M", 150),
  p("Queixo F", 44),
  p("Queixo M", 42),
  p("Braços F", 66),
  p("Costas M", 110),
  p("Braços M", 66),
  p("Rosto F", 99),
  p("Corte Máquina Masculino", 80),
  p("Corte Feminino Franja", 64),
  p("Prancha (adicional, qualquer tamanho)", 50),
  p("Prancha acompanhada de Escova (a depender)", 160),
  p("Esmaltação mãos", 34),
  p("Esmaltação Decorada", 38),
  p("Esmaltação Francesinha Decorada (mão)", 38),
  p("Manicure sem esmaltação (cutícula/lixar/massagem)", 46),
  p("Pedicure completa com Francesinha Decorada", 55),
  p("Pedicure masculino", 52),
  p("Pedicure sem esmaltação (cutícula/lixar/massagem)", 50),
  p("Nádegas", 64),
  p("Virilha Íntima (2 serviços)", 109),
  p("Barriga F", 59),
  p("Dedos dos pés ou mãos F", 44),
  p("Barriga M", 70),
  p("Tórax", 90),
  p("Rosto com cera hipoalergênica", 99),
  p("Dedos dos pés ou mãos (depilação)", 44),
  p("Coloração de sobrancelha (Henna) - sem design", 60),
  p("Completa (1/2 perna + virilha íntima com nádegas)", 260),
];
